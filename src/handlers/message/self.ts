import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { createContextFromMessage } from "../context";
import { getCompletionFor } from "../completion";
import { log } from "../../helpers/utils";
import { BOT_PREFIX } from "../../constants";

export async function handleSelfMessage(message: Message) {
  await log(message);
  await setStatusFor(message, "working");

  try {
    const context = await createContextFromMessage(message);

    const completion = await getCompletionFor(message, context);
    const reply = await message.reply(`${BOT_PREFIX} ${completion.response}`);

    await log(reply, message.timestamp);
    await setStatusFor(message, "done");
  } catch (error) {
    console.error(error);

    await message.reply(`Error: ${JSON.stringify(error)}`);

    await setStatusFor(message, "error");
  }
}
