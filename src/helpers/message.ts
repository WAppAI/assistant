import { Message } from "whatsapp-web.js";
import { Reaction, react } from "../handlers/reactions";

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
