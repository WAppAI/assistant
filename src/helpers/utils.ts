import { Message } from "whatsapp-web.js";
import { REACTIONS } from "../handlers/reactions";
import { whatsapp } from "../clients/whatsapp";
import dayjs from "dayjs";

export async function log(message: Message, initialTimestamp?: number) {
  const chat = await message.getChat();
  const contact = await message.getContact();
  const chatName = chat.isGroup ? `@${chat.name}` : "@dm";

  const isReply = !!initialTimestamp;

  const from = contact.pushname;
  const to =
    chat.isGroup && isReply
      ? (await (await message.getQuotedMessage()).getContact()).pushname
      : (await whatsapp.getContactById(message.to)).pushname;

  const timestamp = dayjs.unix(message.timestamp);
  const timestampStr = timestamp.format("HH:mm:ss");

  const timeDelta =
    initialTimestamp &&
    timestamp.diff(dayjs.unix(initialTimestamp), "milliseconds", true);
  const timeDeltaStr = timeDelta ? `[${timeDelta}ms]` : "";

  console.log(
    `${timestampStr} [${from}->${to}${chatName}]${timeDeltaStr}: ${message.body}`
  );
}

export function isEmoji(str: string) {
  const regex = /[\p{Emoji}]/u;
  return regex.test(str);
}

export function checkEnv() {
  // Checks if all reactions are valid emojis
  Object.values(REACTIONS).forEach((reaction) => {
    if (!isEmoji(reaction)) {
      throw new Error(
        `Invalid emoji "${reaction}" provided for reaction. Please check your .env file.`
      );
    }
  });
}
