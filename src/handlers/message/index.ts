import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";

export async function handleMessage(message: Message) {
  await setStatusFor(message, "working");

  await message.reply(message.body);

  await setStatusFor(message, "done");
}
