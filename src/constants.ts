import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand.expand(dotenv.config());

export const BOT_PREFIX = (process.env.BOT_PREFIX?.trim() + " ") as string;
export const CMD_PREFIX = process.env.CMD_PREFIX?.trim() as string;
export const ASSISTANT_NAME = process.env.ASSISTANT_NAME?.trim() as string;
export const SYSTEM_MESSAGE = process.env.SYSTEM_MESSAGE as string;
export const STREAM_RESPONSES = process.env.STREAM_RESPONSES as string;
export const ENABLE_REMINDERS = process.env.ENABLE_REMINDERS as string;
export const REPLY_RRULES = process.env.REPLY_RRULES as string;
export const ENABLE_REACTIONS = process.env.ENABLE_REACTIONS as string;
export const ENABLE_SOURCES = process.env.ENABLE_SOURCES as string;
export const ENABLE_SUGGESTIONS = process.env.ENABLE_SUGGESTIONS as string;
export const STREAM_REMINDERS = process.env.STREAM_REMINDERS as string;
export const ALLOWED_USERS = process.env.ALLOWED_USERS?.split(",") as string[];
export const BLOCKED_USERS = process.env.BLOCKED_USERS?.split(",") as string[];
export const TRANSCRIPTION_ENABLED = process.env
  .TRANSCRIPTION_ENABLED as string;
export const TRANSCRIPTION_METHOD = process.env.TRANSCRIPTION_METHOD as string;
export const TRANSCRIPTION_LANGUAGE = process.env
  .TRANSCRIPTION_LANGUAGE as string;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
export const REPLY_TRANSCRIPTION = process.env.REPLY_TRANSCRIPTION as string;
export const TRANSCRIPTION_MODEL = process.env.TRANSCRIPTION_MODEL as string;
