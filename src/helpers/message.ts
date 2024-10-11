import { proto, WASocket } from "@whiskeysockets/baileys";
import { Chat, Message } from "whatsapp-web.js";
import { prisma } from "../clients/prisma";
import {
  ALLOWED_USERS,
  BLOCKED_USERS,
  BOT_PREFIX,
  CMD_PREFIX,
  IGNORE_MESSAGES_WARNING,
} from "../constants";
import { string } from "zod";

export function isGroupMessage(message: proto.IWebMessageInfo) {
  return message.key.remoteJid?.endsWith("@g.us") ?? false;
}

export function getPhoneNumber(message: proto.IWebMessageInfo) {
  return message.key.remoteJid?.split("@")[0] ?? "";
}

export async function shouldIgnore(
  message: proto.IWebMessageInfo,
  sock: WASocket
) {
  if (ALLOWED_USERS.length === 0 && BLOCKED_USERS.length === 0) {
    return false;
  }

  const senderNumber = getPhoneNumber(message);

  if (isGroupMessage(message)) {
    // Check if this message came from a blocked user
    if (BLOCKED_USERS.includes(senderNumber)) {
      console.warn(
        `Ignoring message from blocked user "${message.pushName}" <${senderNumber}>`
      );
      return true;
    }

    // Fetch group metadata
    const groupJid = message.key.remoteJid!;
    try {
      const groupMetadata = await sock.groupMetadata(groupJid);

      // Check if any allowed users are in the group
      const allowedInGroup = groupMetadata.participants.some((participant) => {
        const participantNumber = participant.id.split("@")[0];
        return ALLOWED_USERS.includes(participantNumber);
      });

      if (!allowedInGroup) {
        console.warn(
          `Ignoring message from group "${groupMetadata.subject}" because no allowed users are in it`
        );
        return true;
      }
    } catch (error) {
      console.error("Error fetching group metadata:", error);
      return true; // Ignore the message if we can't fetch group data
    }
  } else {
    // It's a private message, so just check if the user is blocked or isn't in the allowed list
    if (
      BLOCKED_USERS.includes(senderNumber) ||
      !ALLOWED_USERS.includes(senderNumber)
    ) {
      console.warn(
        `Ignoring message from blocked/not allowed user "${message.pushName}" <${senderNumber}>`
      );
      return true;
    }
  }

  return false;
}

export async function shouldReply(
  message: proto.IWebMessageInfo,
  sock: WASocket
) {
  const messageBody = message.message?.extendedTextMessage?.text;

  if (typeof messageBody !== "string")
    throw new Error("Message body is not a string");

  const isCommand = messageBody.startsWith(CMD_PREFIX);

  if (isGroupMessage(message) && !isCommand) {
    const mentions =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const isMentioned = mentions.includes(sock.user?.id || "");

    const quotedMessage =
      message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedMessageId =
      message.message?.extendedTextMessage?.contextInfo?.stanzaId;

    const lastWaReply = await prisma.bingConversation.findFirst({
      where: { waChatId: message.key.remoteJid || "" },
      select: { waMessageId: true },
    });

    const isInThread =
      quotedMessageId && quotedMessageId === lastWaReply?.waMessageId;

    if (isMentioned || isInThread) {
      // Replace mentions with names
      let updatedMessageBody = messageBody;
      for (const mention of mentions) {
        const contactName = await getContactName(sock, mention);
        updatedMessageBody = updatedMessageBody.replace(
          `@${mention.split("@")[0]}`,
          contactName
        );
        console.log(`Replaced "${mention}" with "${contactName}"`);
      }

      // Update the message body
      if (message.message?.extendedTextMessage) {
        message.message.extendedTextMessage.text = updatedMessageBody;
      } else if (message.message?.conversation) {
        message.message.conversation = updatedMessageBody;
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
