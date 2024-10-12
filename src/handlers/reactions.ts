import { proto, updateMessageWithReaction } from "@whiskeysockets/baileys";
import { ENABLE_REACTIONS } from "../constants";
import { isGroupMessage } from "../helpers/message";

export const REACTIONS = {
  queued: process.env.QUEUED_REACTION || "🔁",
  working: process.env.WORKING_REACTION || "⚙️",
  done: process.env.DONE_REACTION || "✅",
  error: process.env.ERROR_REACTION || "⚠️",
};

export type Reaction = keyof typeof REACTIONS;

export async function react(
  message: proto.IWebMessageInfo,
  reaction: keyof typeof REACTIONS
) {
  switch (ENABLE_REACTIONS) {
    case "false":
      break;
    case "true":
      updateMessageWithReaction(message, {
        text: REACTIONS[reaction],
        key: {
          remoteJid: message.key.remoteJid,
          fromMe: false,
          id: message.key.id,
        },
      });
      break;
    case "dms_only":
      if (isGroupMessage(message)) return;
      updateMessageWithReaction(message, {
        text: REACTIONS[reaction],
        key: {
          remoteJid: message.key.remoteJid,
          fromMe: false,
          id: message.key.id,
        },
      });
      break;
    case "groups_only":
      if (!isGroupMessage(message)) return;
      updateMessageWithReaction(message, {
        text: REACTIONS[reaction],
        key: {
          remoteJid: message.key.remoteJid,
          fromMe: false,
          id: message.key.id,
        },
      });
      break;
    default:
      break;
  }
}
