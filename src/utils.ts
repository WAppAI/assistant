import { z, ZodType } from "zod";
import { Message } from "whatsapp-web.js";
import { config } from "./config";
import dotenv from "dotenv";
dotenv.config();

const ENABLE_REACTIONS =
  (process.env.ENABLE_REACTIONS as
    | "true"
    | "false"
    | "dms_only"
    | "groups_only") || "true";
const QUEUED_REACTION = process.env.QUEUED_REACTION || "🔁";
const WORKING_REACTION = process.env.WORKING_REACTION || "⚙️";
const DONE_REACTION = process.env.DONE_REACTION || "✅";
const ERROR_REACTION = process.env.ERROR_REACTION || "⚠️";

const reactEmoji = {
  queued: QUEUED_REACTION,
  working: WORKING_REACTION,
  done: DONE_REACTION,
  error: ERROR_REACTION
};

export async function react(
  message: Message,
  reaction: "queued" | "working" | "done" | "error"
) {
  const chat = await message.getChat();

  switch (ENABLE_REACTIONS) {
    case "false":
      break;
    case "true":
      await message.react(reactEmoji[reaction]);
      break;
    case "dms_only":
      if (!chat.isGroup) await message.react(reactEmoji[reaction]);
      break;
    case "groups_only":
      if (chat.isGroup) await message.react(reactEmoji[reaction]);
      break;
    default:
      await message.react(reactEmoji[reaction]);
      break;
  }
}

export function jsonSafeParse<T extends ZodType<any>>(
  str: string,
  schema: T,
  logError = false
): z.infer<T> | null {
  try {
    const parsedValue = schema.safeParse(JSON.parse(str));
    if (parsedValue.success) {
      // Parsing was successful
      return parsedValue.data;
    } else {
      // Parsing failed
      if (logError) console.error("Parsing failed:", parsedValue.error);
      return null; // Or handle the error in any other way
    }
  } catch (error) {
    if (logError) console.error("Parsing failed:", error);
    return null;
  }
}

// function generated by GPT-4
export function getAvailableTones() {
  const toneCount = config.VALID_TONES.length;
  let availableTonesString = "Available options for tones are ";

  config.VALID_TONES.forEach((tone, index) => {
    if (index === toneCount - 1) {
      // Add 'and' before the last element
      availableTonesString += " and ";
    } else if (index !== 0) {
      // Add comma before non-first elements
      availableTonesString += ", ";
    }
    availableTonesString += `${tone}`;
  });

  availableTonesString += ".";

  return availableTonesString;
}
