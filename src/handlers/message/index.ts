import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { createContextFromMessage } from "../context";
import { getCompletionFor } from "../completion";
import { log } from "../../helpers/utils";
import { BOT_PREFIX } from "../../constants";

export async function handleMessage(message: Message) {
  await log(message);
  await setStatusFor(message, "working");
  let reply = await message.reply("...");

  try {
    const context = await createContextFromMessage(message);

    const completion = await getCompletionFor(message, context, reply);
    reply = (await reply.edit(completion.response)) as Message;

    await log(reply, true);
    await setStatusFor(message, "done");
  } catch (error) {
    console.error(error);

    await reply.edit(BOT_PREFIX + `Error: ${JSON.stringify(error)}`);

    await setStatusFor(message, "error");
  }
}
