import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand.expand(dotenv.config());

export const REPLY_RRULES = process.env.REPLY_RRULES || "true";
export const ENABLE_REACTIONS = process.env.ENABLE_REACTIONS || "true";
export const ENABLE_SOURCES = process.env.ENABLE_SOURCES || "true";
export const ENABLE_SUGGESTIONS = process.env.ENABLE_SUGGESTIONS || "true";
export const STREAM_REMINDERS = process.env.STREAM_REMINDERS || "true";
export const STREAM_RESPONSES = process.env.STREAM_RESPONSES || "true";
export const BOT_PREFIX = process.env.BOT_PREFIX?.trim() + " " || "[BOT]: ";
export const ALLOWED_USERS = process.env.ALLOWED_USERS?.split(",") || [];
export const BLOCKED_USERS = process.env.BLOCKED_USERS?.split(",") || [];
export const SYSTEM_MESSAGE = process.env.SYSTEM_MESSAGE;
