import { GroupChat, Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { log } from "../../helpers/utils";
import { BOT_PREFIX, CMD_PREFIX } from "../../constants";
import { handleJailbreak } from "./jailbreak";
import { handleReset } from "./reset";
import { stripIndents } from "common-tags";
import { helpStatement, unauthorizedCommandFor } from "../../helpers/command";
import { handleHelp } from "./help";
import { handleReminderCommand } from "./reminder";
import { handleChangeLLM } from "./change-llm";

const adminCommands = ["jailbreak", "reset", "change"];

export async function handleCommand(message: Message) {
  const [command, ..._args] = message.body.split(CMD_PREFIX)[1].split(" ");
  const args = _args.join(" ").toLowerCase();
  let reply: Message;

  await log(message);
  await setStatusFor(message, "working");

  const chat = await message.getChat();
  let isAdmin = true; // default to true for private chats
  if (chat.isGroup) {
    const groupChat = chat as GroupChat;
    const contact = await message.getContact();
    isAdmin = groupChat.participants.filter(
      (participant) => participant.id._serialized === contact.id._serialized
    )[0].isAdmin;
  }

  if (adminCommands.includes(command) && !isAdmin) {
    reply = await message.reply(unauthorizedCommandFor(command));
    await log(reply, true);
    await setStatusFor(message, "done");
    return;
  }

  switch (command) {
    case "ping":
      reply = await message.reply(BOT_PREFIX + "*_pong!_*");
      break;
    case "reset":
      reply = await handleReset(message, args);
      break;
    case "jailbreak":
      reply = await handleJailbreak(message, args);
      break;
    case "reminder":
      reply = await handleReminderCommand(message, args);
      break;
    case "change":
      reply = await handleChangeLLM(message, args);
      break;
    case "help":
      reply = await handleHelp(message, args);
      break;
    default:
      reply = await message.reply(
        stripIndents`
        ${BOT_PREFIX}Unknown command _"${CMD_PREFIX + command}"_

        ${helpStatement}`
      );
      break;
  }

  await log(reply, true);
  await setStatusFor(message, "done");
}
