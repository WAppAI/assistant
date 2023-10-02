import { Message } from "whatsapp-web.js";
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
  const contact = await message.getContact();
  const number = contact.number;

  const ignore =
    BLOCKED_USERS.includes(number) || !ALLOWED_USERS.includes(number);

  ignore &&
    console.warn(
      `Ignoring message from unknown user "${contact.pushname}" (${number})`
    );

  return ignore;
}
