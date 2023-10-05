import { GroupChat, Message } from "whatsapp-web.js";
import { Reaction, react } from "../handlers/reactions";
import { ALLOWED_USERS, BLOCKED_USERS } from "../constants";

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
      console.warn(`Ignoring message from blocked user "${contact.pushname}" <${contact.number}>`);
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
  } else if (BLOCKED_USERS.includes(contact.number) || !ALLOWED_USERS.includes(contact.number)) {
    // It's a private message, so just check if the user is blocked or isn't in the allowed list
    console.warn(
      `Ignoring message from blocked/not allowed user "${contact.pushname}" <${contact.number}>`
    );
    return true;
  }

  return false;
}
