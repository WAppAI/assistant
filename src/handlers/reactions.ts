import { Message } from "whatsapp-web.js";

export const REACTIONS = {
  queued: Bun.env.QUEUED_REACTION || "🔁",
  working: Bun.env.WORKING_REACTION || "⚙️",
  done: Bun.env.DONE_REACTION || "✅",
  error: Bun.env.ERROR_REACTION || "⚠️",
};

export type Reaction = keyof typeof REACTIONS;

export async function react(
  message: Message,
  reaction: keyof typeof REACTIONS
) {
  const chat = await message.getChat();
  const enableReactions = Bun.env.ENABLE_REACTIONS || "true";

  switch (enableReactions) {
    case "false":
      break;
    case "true":
      await message.react(REACTIONS[reaction]);
      break;
    case "dms_only":
      if (!chat.isGroup) await message.react(REACTIONS[reaction]);
      break;
    case "groups_only":
      if (chat.isGroup) await message.react(REACTIONS[reaction]);
      break;
    default:
      break;
  }
}
