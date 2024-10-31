import { proto } from "@whiskeysockets/baileys";
import { stripIndents } from "common-tags";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
import utc from "dayjs/plugin/utc";
import { getLLMModel } from "../../crud/conversation";
import { getChatContext } from "./chat";
import { reminderContext } from "./reminder";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function createContextFromMessage(message: proto.IWebMessageInfo) {
  const timezone = dayjs.tz.guess();
  const timestampUTC = dayjs().utc();
  const timestampLocal = timestampUTC.tz(timezone).format();
  const chatId = message.key.remoteJid;
  if (typeof chatId !== "string") return `Invalid chat ID: ${chatId}`;
  const llmModel = await getLLMModel(chatId);

  const chatContext = await getChatContext(message);

  const context = stripIndents`[system](#context)
  - The chat ID is '${chatId}'
  ${chatContext}
  - The user's timezone is '${timezone}'
  - The user's local date and time is: ${timestampLocal}

  ${llmModel === "bing" ? reminderContext : ""}
  `;

  return context;
}
