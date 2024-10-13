import { proto } from "@whiskeysockets/baileys";
import { sock } from "../clients/new-whatsapp";
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
      await sock.sendMessage(message.key.remoteJid!, {
        react: {
          text: REACTIONS[reaction],
          key: message.key,
        },
      });
      break;
    case "dms_only":
      if (isGroupMessage(message)) return;
      await sock.sendMessage(message.key.remoteJid!, {
        react: {
          text: REACTIONS[reaction],
          key: message.key,
        },
      });
      break;
    case "groups_only":
      if (!isGroupMessage(message)) return;
      await sock.sendMessage(message.key.remoteJid!, {
        react: {
          text: REACTIONS[reaction],
          key: message.key,
        },
      });
      break;
    default:
      break;
  }
}
