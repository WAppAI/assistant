import { stripIndents } from "common-tags";
import { reminderContext } from "./reminder";
import { getChatContext } from "./chat";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
import { getLLMModel } from "../../crud/conversation";
import { proto, WASocket } from "@whiskeysockets/baileys";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function createContextFromMessage(
  message: proto.IWebMessageInfo,
  sock: WASocket
) {
  const timezone = dayjs.tz.guess();
  const timestampUTC = dayjs().utc();
  const timestampLocal = timestampUTC.tz(timezone).format();
  const chatId = message.key.remoteJid;
  if (typeof chatId !== "string") throw new Error("Chat ID is not a string");
  const llmModel = await getLLMModel(chatId);

  const chatContext = await getChatContext(message, sock);

  const context = stripIndents`[system](#context)
  - The chat ID is '${chatId}'
  ${chatContext}
  - The user's timezone is '${timezone}'
  - The user's local date and time is: ${timestampLocal}

  ${llmModel === "bing" ? reminderContext : ""}
  `;

  return context;
}
