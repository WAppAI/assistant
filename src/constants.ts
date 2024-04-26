import {
  BingAIClientSendMessageOptions,
  // @ts-ignore
} from "@waylaidwanderer/chatgpt-api";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand.expand(dotenv.config());

export const BOT_PREFIX = (process.env.BOT_PREFIX?.trim() + " ") as string;
export const CMD_PREFIX = process.env.CMD_PREFIX?.trim() as string;
export const BING_TONESTYLE = process.env
  .BING_TONESTYLE as BingAIClientSendMessageOptions["toneStyle"];
export const ASSISTANT_NAME = process.env.ASSISTANT_NAME?.trim() as string;
export const BING_SYSTEM_MESSAGE = process.env.BING_SYSTEM_MESSAGE as string;
export const OPEN_ROUTER_SYSTEM_MESSAGE = process.env
  .OPEN_ROUTER_SYSTEM_MESSAGE as string;
export const STREAM_RESPONSES = process.env.STREAM_RESPONSES as string;
export const ENABLE_REMINDERS = process.env.ENABLE_REMINDERS as string;
export const REPLY_RRULES = process.env.REPLY_RRULES as string;
export const ENABLE_REACTIONS = process.env.ENABLE_REACTIONS as string;
export const ENABLE_SOURCES = process.env.ENABLE_SOURCES as string;
export const ENABLE_SUGGESTIONS = process.env.ENABLE_SUGGESTIONS as string;
export const STREAM_REMINDERS = process.env.STREAM_REMINDERS as string;
export const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(",")
  : [];
export const BLOCKED_USERS = process.env.BLOCKED_USERS
  ? process.env.BLOCKED_USERS.split(",")
  : [];
export const TRANSCRIPTION_ENABLED = process.env
  .TRANSCRIPTION_ENABLED as string;
export const TRANSCRIPTION_METHOD = process.env.TRANSCRIPTION_METHOD as string;
export const TRANSCRIPTION_LANGUAGE = process.env
  .TRANSCRIPTION_LANGUAGE as string;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
export const REPLY_TRANSCRIPTION = process.env.REPLY_TRANSCRIPTION as string;
export const TRANSCRIPTION_MODEL = process.env.TRANSCRIPTION_MODEL as string;
export const IGNORE_MESSAGES_WARNING = process.env
  .IGNORE_MESSAGES_WARNING as string;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY as string;
export const OPENROUTER_MSG_MEMORY_LIMIT = parseInt(
  process.env.OPENROUTER_MSG_MEMORY_LIMIT as string
);
export const OPENROUTER_MEMORY_TYPE = process.env
  .OPENROUTER_MEMORY_TYPE as string;
export const SUMMARY_LLM_MODEL = process.env.SUMMARY_LLM_MODEL as string;
export const DEBUG_SUMMARY = process.env.DEBUG_SUMMARY as string;
export const LOG_MESSAGES = process.env.LOG_MESSAGES as string;
export const SEARCH_API = process.env.SEARCH_API as string;
export const BING_COOKIES = process.env.BING_COOKIES as string;
export const ENABLE_GOOGLE_CALENDAR = process.env
  .ENABLE_GOOGLE_CALENDAR as string;
export const GOOGLE_CALENDAR_CLIENT_EMAIL = process.env
  .GOOGLE_CALENDAR_CLIENT_EMAIL as string;
export const GOOGLE_CALENDAR_PRIVATE_KEY = process.env
  .GOOGLE_CALENDAR_PRIVATE_KEY as string;
export const GOOGLE_CALENDAR_CALENDAR_ID = process.env
  .GOOGLE_CALENDAR_CALENDAR_ID as string;
export const ENABLE_WEB_BROWSER_TOOL = process.env
  .ENABLE_WEB_BROWSER_TOOL as string;
export const ENABLE_DALLE_TOOL = process.env.ENABLE_DALLE_TOOL as string;
export const DALLE_MODEL = process.env.DALLE_MODEL as string;
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL as string;
