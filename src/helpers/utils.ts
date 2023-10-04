import { Message } from "whatsapp-web.js";
import { REACTIONS } from "../handlers/reactions";
import { whatsapp } from "../clients/whatsapp";
import dayjs from "dayjs";

export async function log(message: Message | null, isReply: boolean = false) {
  if (!message) return;

  const chat = await message.getChat();
  const contact = await message.getContact();
  const chatName = chat.isGroup ? `@${chat.name}` : "@dm";

  const from = contact.pushname;
  const to =
    chat.isGroup && isReply
      ? (await (await message.getQuotedMessage()).getContact()).pushname
      : (await whatsapp.getContactById(message.to)).pushname;

  const timestamp = dayjs();
  const timestampStr = timestamp.format("HH:mm:ss");

  console.log(`${timestampStr} [${from}->${to}${chatName}]: ${message.body}`);
}

export function isEmoji(str: string) {
  const regex = /[\p{Emoji}]/u;
  return regex.test(str);
}

export function checkEnv() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      `Invalid database url "${process.env.DATABASE_URL}" provided. Please check the DATABASE_URL variable your .env file.`
    );
  if (!process.env.BOT_PREFIX)
    throw new Error(
      `Invalid bot prefix "${process.env.BOT_PREFIX}" provided. Please check the BOT_PREFIX variable your .env file.`
    );

  if (!process.env.ASSISTANT_NAME)
    throw new Error(
      `Invalid assistant name "${process.env.ASSISTANT_NAME}" provided. Please check the ASSISTANT_NAME variable your .env file.`
    );

  if (!process.env.SYSTEM_MESSAGE)
    throw new Error(
      `Invalid system message "${process.env.SYSTEM_MESSAGE}" provided. Please check the SYSTEM_MESSAGE variable your .env file.`
    );

  if (process.env.ENABLE_REACTIONS !== "false")
    // Checks if all reactions are valid emojis
    Object.values(REACTIONS).forEach((reaction) => {
      if (!isEmoji(reaction)) {
        throw new Error(
          `Invalid reaction "${reaction}" provided. Please check the reactions variables your .env file. Make sure to only use emojis.`
        );
      }
    });
}
