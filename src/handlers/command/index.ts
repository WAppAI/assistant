import { proto, WASocket } from "@whiskeysockets/baileys";
import { BOT_PREFIX, CMD_PREFIX } from "../../constants";
import { handleJailbreak } from "./jailbreak";
import { handleReset } from "./reset";
import { stripIndents } from "common-tags";
import { helpStatement, unauthorizedCommandFor } from "../../helpers/command";
import { handleHelp } from "./help";
import { handleReminderCommand } from "./reminder";
import { handleChangeLLM, LLM_OPTIONS } from "./change-llm";
import { react } from "../reactions";

const adminCommands = ["jailbreak", "reset", "change"];

export async function handleCommand(
  sock: WASocket,
  message: proto.IWebMessageInfo
) {
  const messageBody = message.message?.extendedTextMessage?.text || "";
  const [command, ..._args] = messageBody.split(CMD_PREFIX)[1].split(" ");

  const args = _args.join(" ").toLowerCase();
  let reply: string;

  await react(message, "working");

  const chatId = message.key.remoteJid;
  if (!chatId) {
    await react(message, "error");
    return;
  }
  let isAdmin = true; // default to true for private chats
  if (chatId.endsWith("@g.us")) {
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderId = message.key.participant || message.key.remoteJid;
    isAdmin = groupMetadata.participants.some(
      (participant) => participant.id === senderId && participant.admin
    );
  }

  if (adminCommands.includes(command) && !isAdmin) {
    reply = unauthorizedCommandFor(command);
    await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    await react(message, "done");
    return;
  }

  switch (command) {
    case "ping":
      reply = BOT_PREFIX + "*_pong!_*";
      break;
    case "reset":
      reply = await handleReset(message, args, sock);
      break;
    case "jailbreak":
      reply = await handleJailbreak(message, args, sock);
      break;
    case "reminder":
      reply = await handleReminderCommand(message, args, sock);
      break;
    case "change":
      reply = await handleChangeLLM(message, args as keyof typeof LLM_OPTIONS);
      break;
    case "help":
      reply = await handleHelp(message, args);
      break;
    default:
      reply = stripIndents`
        ${BOT_PREFIX}Unknown command _"${CMD_PREFIX + command}"_

        ${helpStatement}`;
      break;
  }

  await sock.sendMessage(chatId, { text: reply }, { quoted: message });
  await react(message, "done");
}
