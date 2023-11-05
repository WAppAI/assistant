import { Chat, GroupChat, Message } from "whatsapp-web.js";
import { Reaction, react } from "../handlers/reactions";
import {
  ALLOWED_USERS,
  BLOCKED_USERS,
  BOT_PREFIX,
  CMD_PREFIX,
  IGNORE_MESSAGES_WARNING,
} from "../constants";
import { prisma } from "../clients/prisma";

async function workingOn(message: Message) {
  const chat = await message.getChat();
  await chat.clearState();
  await chat.sendSeen();

  await react(message, "working");
  chat.sendStateTyping();
}

async function doneWith(message: Message, reaction: Reaction = "done") {
  const chat = await message.getChat();
  await react(message, reaction);
  await chat.clearState();
}

type Status = Reaction;

export async function setStatusFor(message: Message, status: Status) {
  switch (status) {
    case "working":
      await workingOn(message);
      break;
    case "done":
      await doneWith(message);
      break;
    case "error":
      await doneWith(message, "error");
      break;
    default:
      break;
  }
}

export async function shouldIgnore(message: Message) {
  if (ALLOWED_USERS.length === 0 && BLOCKED_USERS.length === 0) {
    return false;
  }

  const contact = await message.getContact();
  const chat = await message.getChat();

  if (chat.isGroup) {
    const groupChat = chat as GroupChat;

    // Check if this message came from a blocked user
    if (BLOCKED_USERS.includes(contact.number)) {
      console.warn(
        `Ignoring message from blocked user "${contact.pushname}" <${contact.number}>`
      );
      return true;
    }

    // Check if any allowed users are in the group
    const allowedInGroup = groupChat.participants.some((p) => {
      return ALLOWED_USERS.includes(p.id.user);
    });

    if (!allowedInGroup) {
      console.warn(
        `Ignoring message from group "${groupChat.name}" because no allowed users are in it`
      );
      return true;
    }
  } else if (
    BLOCKED_USERS.includes(contact.number) ||
    !ALLOWED_USERS.includes(contact.number)
  ) {
    // It's a private message, so just check if the user is blocked or isn't in the allowed list
    console.warn(
      `Ignoring message from blocked/not allowed user "${contact.pushname}" <${contact.number}>`
    );
    return true;
  }

  return false;
}

export async function shouldReply(message: Message) {
  const isCommand = message.body.startsWith(CMD_PREFIX);
  const chat = await message.getChat();

  if (chat.isGroup && !isCommand) {
    const mentions = await message.getMentions();
    const isMentioned = mentions.some(
      (mention) => mention.id._serialized === message.to
    );

    const quotedMessage = await message.getQuotedMessage();
    const lastWaReply = await prisma.bingConversation.findFirst({
      where: { waChatId: chat.id._serialized },
      select: { waMessageId: true },
    });
    const isInThread =
      quotedMessage && quotedMessage.id._serialized == lastWaReply?.waMessageId;

    if (isMentioned || isInThread) {
      for (const mention of mentions) {
        message.body = message.body.replace(
          `@${mention.id.user}`,
          mention.pushname
        );
        console.log(`Replaced "${mention.id.user}" with "${mention.pushname}"`);
      }
    } else {
      console.warn(
        "Group message received, but the bot was not mentioned neither its last completion was quoted in a thread. Ignoring."
      );
      return false;
    }
  }

  return true;
}

export async function shouldIgnoreUnread(chat: Chat) {
  if (chat.unreadCount > 1) {
    await chat.sendSeen();
    if (chat.isGroup) {
      console.warn(
        `Too many unread messages (${chat.unreadCount}) for group chat "${chat.name}". Ignoring...`
      );
      if (IGNORE_MESSAGES_WARNING === "true") {
        await chat.sendMessage(
          BOT_PREFIX +
            `Too many unread messages (${chat.unreadCount}) since I've last seen this chat. I'm ignoring them. If you need me to respond, please @mention me or quote my last completion in this chat.`
        );
      }
    } else {
      const contact = await chat.getContact();
      console.warn(
        `Too many unread messages (${chat.unreadCount}) for chat with user "${contact.pushname}" <${contact.number}>. Ignoring...`
      );
      if (IGNORE_MESSAGES_WARNING === "true") {
        await chat.sendMessage(
          BOT_PREFIX +
            `Too many unread messages (${chat.unreadCount}) since I've last seen this chat. I'm ignoring them. If you need me to respond, please message me again.`
        );
      }
    }

    return true;
  }
}
