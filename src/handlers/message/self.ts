import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";

const BOT_PREFIX = "(bot):";

export async function handleSelfMessage(message: Message) {
  const isSelf = message.to === message.from;
  const isBotMessage = message.body.startsWith(BOT_PREFIX);
  if (!isSelf || isBotMessage) return;

  await setStatusFor(message, "working");

  message.body = `${BOT_PREFIX} ${message.body}`;
  await message.reply(message.body);

  await setStatusFor(message, "done");
}
