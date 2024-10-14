import { REACTIONS } from "../handlers/reactions";

export function checkEnv() {
  if (!process.env.DEFAULT_MODEL) {
    throw new Error(
      `Invalid DEFAULT_MODEL="${process.env.DEFAULT_MODEL}" provided. Please check the DEFAULT_MODEL variable in your .env file.`
    );
  }

  // Additional checks for optional variables related to audio transcription
  // Check for audio transcription settings
  if (process.env.TRANSCRIPTION_ENABLED === "true") {
    if (
      !process.env.TRANSCRIPTION_METHOD ||
      !["whisper-api", "local", "whisper-groq"].includes(
        process.env.TRANSCRIPTION_METHOD
      )
    ) {
      throw new Error(
        `Invalid TRANSCRIPTION_METHOD="${process.env.TRANSCRIPTION_METHOD}" provided. Please check the TRANSCRIPTION_METHOD variable in your .env file.`
      );
    }

    if (
      !process.env.REPLY_TRANSCRIPTION ||
      !["true", "false"].includes(process.env.REPLY_TRANSCRIPTION)
    ) {
      throw new Error(
        `Invalid REPLY_TRANSCRIPTION="${process.env.REPLY_TRANSCRIPTION}" provided. Please check the REPLY_TRANSCRIPTION variable in your .env file.`
      );
    }

    if (process.env.TRANSCRIPTION_METHOD === "local") {
      if (!process.env.TRANSCRIPTION_MODEL) {
        throw new Error(
          `Invalid TRANSCRIPTION_MODEL="${process.env.TRANSCRIPTION_MODEL}" provided. Please check the TRANSCRIPTION_MODEL variable in your .env file. Or disable audio transcription by setting TRANSCRIPTION_ENABLED to "false".`
        );
      }
    } else if (process.env.TRANSCRIPTION_METHOD === "whisper-api") {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "") {
        throw new Error(
          `Invalid OPENAI_API_KEY="${process.env.OPENAI_API_KEY}" provided. Please check the OPENAI_API_KEY variable in your .env file. Or disable audio transcription by setting TRANSCRIPTION_ENABLED to "false".`
        );
      }
    } else if (process.env.TRANSCRIPTION_METHOD === "whisper-groq") {
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "") {
        throw new Error(
          `Invalid GROQ_API_KEY="${process.env.GROQ_API_KEY}" provided. Please check the GROQ_API_KEY variable in your .env file. Or disable audio transcription by setting TRANSCRIPTION_ENABLED to "false".`
        );
      }
    }
  }
}

// Additional checks for other optional variables
if (
  process.env.STREAM_RESPONSES &&
  !["true", "false"].includes(process.env.STREAM_RESPONSES)
) {
  throw new Error(
    `Invalid STREAM_RESPONSES="${process.env.STREAM_RESPONSES}" provided. Accepted values are "true" or "false". Please check the STREAM_RESPONSES variable in your .env file.`
  );
}

if (
  process.env.ENABLE_REMINDERS &&
  !["true", "false"].includes(process.env.ENABLE_REMINDERS)
) {
  throw new Error(
    `Invalid ENABLE_REMINDERS="${process.env.ENABLE_REMINDERS}" provided. Accepted values are "true" or "false". Please check the ENABLE_REMINDERS variable in your .env file.`
  );
}

if (
  process.env.STREAM_REMINDERS &&
  !["true", "false"].includes(process.env.STREAM_REMINDERS)
) {
  throw new Error(
    `Invalid STREAM_REMINDERS="${process.env.STREAM_REMINDERS}" provided. Accepted values are "true" or "false". Please check the STREAM_REMINDERS variable in your .env file.`
  );
}

if (
  process.env.REPLY_RRULES &&
  !["true", "false"].includes(process.env.REPLY_RRULES)
) {
  throw new Error(
    `Invalid REPLY_RRULES="${process.env.REPLY_RRULES}" provided. Accepted values are "true" or "false". Please check the REPLY_RRULES variable in your .env file.`
  );
}

if (
  process.env.ENABLE_SOURCES &&
  !["true", "false"].includes(process.env.ENABLE_SOURCES)
) {
  throw new Error(
    `Invalid ENABLE_SOURCES="${process.env.ENABLE_SOURCES}" provided. Accepted values are "true" or "false". Please check the ENABLE_SOURCES variable in your .env file.`
  );
}

// Check for reactions
if (
  process.env.ENABLE_REACTIONS &&
  !["true", "dms_only", "groups_only", "false"].includes(
    process.env.ENABLE_REACTIONS
  )
) {
  throw new Error(
    `Invalid ENABLE_REACTIONS="${process.env.ENABLE_REACTIONS}" provided. Accepted values are "true", "dms_only", "groups_only" or "false". Please check the ENABLE_REACTIONS variable in your .env file.`
  );
}

if (process.env.ENABLE_REACTIONS !== "false") {
  // Checks if all reactions are valid emojis
  Object.values(REACTIONS).forEach((reaction) => {
    if (!isEmoji(reaction)) {
      throw new Error(
        `Invalid reaction "${reaction}" provided. Please check the reactions variables in your .env file. Make sure to only use emojis.`
      );
    }
  });
}

if (process.env.BLOCKED_USERS) {
  console.warn(
    "BLOCKED_USERS provided. The bot will ignore messages from these users."
  );
}

// Check other required variables
if (
  !process.env.BOT_PREFIX ||
  !process.env.CMD_PREFIX ||
  process.env.BOT_PREFIX === process.env.CMD_PREFIX
) {
  throw new Error(
    `Invalid BOT_PREFIX/CMD_PREFIX provided. The bot prefix and the command prefix must be different. Please check your .env file.`
  );
}

if (!process.env.ASSISTANT_NAME) {
  throw new Error(
    `Invalid ASSISTANT_NAME="${process.env.ASSISTANT_NAME}" provided. Please check the ASSISTANT_NAME variable in your .env file.`
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    `Invalid DATABASE_URL="${process.env.DATABASE_URL}" provided. Please check the DATABASE_URL variable in your .env file.`
  );
}

if (
  process.env.LOG_MESSAGES &&
  !["true", "false"].includes(process.env.LOG_MESSAGES)
) {
  throw new Error(
    `Invalid LOG_MESSAGES="${process.env.LOG_MESSAGES}" provided. Accepted values are "true" or "false". Please check the LOG_MESSAGES variable in your .env file.`
  );
}

export function isEmoji(str: string) {
  const regex = /[\p{Emoji}]/u;
  return regex.test(str);
}
