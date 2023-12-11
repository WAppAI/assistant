import { TRANSCRIPTION_METHOD, OPENAI_API_KEY } from "./../constants";
import { Message } from "whatsapp-web.js";
import { REACTIONS } from "../handlers/reactions";
import { whatsapp } from "../clients/whatsapp";
import dayjs from "dayjs";

export function checkEnv() {
  if (!process.env.LLM_MODEL) {
    console.warn(
      "DEFAULT_LLM_MODEL not provided. You must set a LLM_MODEL. Please check your .env file."
    );
  } else if (process.env.LLM_MODEL != "bing") {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn(
        "OPENROUTER_API_KEY not provided. You must set a OPENROUTER_API_KEY. Please check your .env file."
      );
    }

    if (!process.env.BING_COOKIES) {
      console.warn(
        "BING_COOKIES not provided. The bot will work, but you may soon need to solve captchas."
      );
    }

    if (!process.env.BING_TONESTYLE) {
      console.warn(
        "invalid BING_TONESTYLE provided. You must set a tonestyle. Please check your .env file."
      );
    }

    if (!process.env.BING_SYSTEM_MESSAGE)
      throw new Error(
        `Invalid BING_SYSTEM_MESSAGE="${process.env.BING_SYSTEM_MESSAGE}" provided. Please check the SYSTEM_MESSAGE variable your .env file.`
      );

    if (
      !process.env.ENABLE_SUGGESTIONS ||
      !["true", "false"].includes(process.env.ENABLE_SUGGESTIONS)
    )
      throw new Error(
        `Invalid ENABLE_SUGGESTIONS="${process.env.ENABLE_SUGGESTIONS}" provided. Accepted values are "true" or "false". Please check the ENABLE_SUGGESTIONS variable your .env file.`
      );
  } else {
    if (!process.env.OPENROUTER_MSG_MEMORY_LIMIT) {
      throw new Error(
        `Invalid OPENROUTER_MSG_MEMORY_LIMIT="${process.env.OPENROUTER_MSG_MEMORY_LIMIT}" provided. Please check the OPENROUTER_MSG_MEMORY_LIMIT variable your .env file.`
      );
    }
  }

  if (process.env.BOT_PREFIX === process.env.CMD_PREFIX)
    throw new Error(
      `Invalid BOT_PREFIX/CMD_PREFIX provided. The bot prefix and the command prefix must be different. Please check your .env file.`
    );
  else if (!process.env.BOT_PREFIX && !process.env.CMD_PREFIX)
    throw new Error(
      `Invalid BOT_PREFIX/CMD_PREFIX provided. Both must not be empty. Please check your .env file.`
    );

  if (!process.env.ASSISTANT_NAME)
    throw new Error(
      `Invalid ASSISTANT_NAME="${process.env.ASSISTANT_NAME}" provided. Please check the ASSISTANT_NAME variable your .env file.`
    );

  if (!process.env.OPEN_ROUTER_SYSTEM_MESSAGE)
    throw new Error(
      `Invalid SYSTEM_MESSAGE="${process.env.SYSTEM_MESSAGE}" provided. Please check the SYSTEM_MESSAGE variable your .env file.`
    );

  if (!process.env.DATABASE_URL)
    throw new Error(
      `Invalid DATABASE_URL="${process.env.DATABASE_URL}" provided. Please check the DATABASE_URL variable your .env file.`
    );

  if (
    !process.env.STREAM_RESPONSES ||
    !["true", "false"].includes(process.env.STREAM_RESPONSES)
  )
    throw new Error(
      `Invalid STREAM_RESPONSES="${process.env.STREAM_RESPONSES}" provided. Accepted values are "true" or "false". Please check the STREAM_RESPONSES variable your .env file.`
    );

  if (
    !process.env.ENABLE_REMINDERS ||
    !["true", "false"].includes(process.env.ENABLE_REMINDERS)
  )
    throw new Error(
      `Invalid ENABLE_REMINDERS="${process.env.ENABLE_REMINDERS}" provided. Accepted values are "true" or "false". Please check the ENABLE_REMINDERS variable your .env file.`
    );

  if (
    !process.env.STREAM_REMINDERS ||
    !["true", "false"].includes(process.env.STREAM_REMINDERS)
  )
    throw new Error(
      `Invalid STREAM_REMINDERS="${process.env.STREAM_REMINDERS}" provided. Accepted values are "true" or "false". Please check the STREAM_REMINDERS variable your .env file.`
    );

  if (
    !process.env.REPLY_RRULES ||
    !["true", "false"].includes(process.env.REPLY_RRULES)
  )
    throw new Error(
      `Invalid REPLY_RRULES="${process.env.REPLY_RRULES}" provided. Accepted values are "true" or "false". Please check the REPLY_RRULES variable your .env file.`
    );

  if (
    !process.env.ENABLE_SOURCES ||
    !["true", "false"].includes(process.env.ENABLE_SOURCES)
  )
    throw new Error(
      `Invalid ENABLE_SOURCES="${process.env.ENABLE_SOURCES}" provided. Accepted values are "true" or "false". Please check the ENABLE_SOURCES variable your .env file.`
    );

  if (
    !process.env.ENABLE_REACTIONS ||
    !["true", "dms_only", "groups_only", "false"].includes(
      process.env.ENABLE_REACTIONS
    )
  )
    throw new Error(
      `Invalid ENABLE_REACTIONS="${process.env.ENABLE_REACTIONS}" provided. Accepted values are "true", "dms_only", "groups_only" or "false". Please check the ENABLE_REACTIONS variable your .env file.`
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

  if (process.env.BLOCKED_USERS)
    console.warn(
      "BLOCKED_USERS provided. The bot will ignore messages from these users."
    );

  if (process.env.TRANSCRIPTION_ENABLED === "true") {
    if (
      !process.env.TRANSCRIPTION_METHOD ||
      !["whisper-api", "local"].includes(process.env.TRANSCRIPTION_METHOD)
    )
      throw new Error(
        `Invalid TRANSCRIPTION_METHOD="${process.env.TRANSCRIPTION_METHOD}" provided. Please check the TRANSCRIPTION_METHOD variable your .env file.`
      );
    if (process.env.TRANSCRIPTION_METHOD === "local") {
      if (!process.env.TRANSCRIPTION_MODEL)
        throw new Error(
          `Invalid TRANSCRIPTION_MODEL="${process.env.TRANSCRIPTION_MODEL}" provided. Please check the TRANSCRIPTION_MODEL variable your .env file.`
        );
    }
    if (
      !process.env.REPLY_TRANSCRIPTION ||
      !["true", "false"].includes(process.env.REPLY_TRANSCRIPTION)
    )
      throw new Error(
        `Invalid REPLY_TRANSCRIPTION="${process.env.REPLY_TRANSCRIPTION}" provided. Please check the REPLY_TRANSCRIPTION variable your .env file.`
      );
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "")
      throw new Error(
        `Invalid OPENAI_API_KEY="${process.env.OPENAI_API_KEY}" provided. Please check the OPENAI_API_KEY variable your .env file.`
      );
  } else if (process.env.TRANSCRIPTION_ENABLED === "false") {
  } else {
    throw new Error(
      `Invalid TRANSCRIPTION_ENABLED="${process.env.TRANSCRIPTION_ENABLED}" provided. Accepted values are "true" or "false". Please check the TRANSCRIPTION_ENABLED variable your .env file.`
    );
  }
}

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
