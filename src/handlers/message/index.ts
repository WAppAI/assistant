import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { createContextFromMessage } from "../context";
import { getCompletionFor, getSources, getSuggestions } from "../completion";
import { log } from "../../helpers/utils";
import {
  BOT_PREFIX,
  ENABLE_REMINDERS,
  ENABLE_SOURCES,
  ENABLE_SUGGESTIONS,
} from "../../constants";
import { handleReminderFor } from "../reminder/reminder.ts";
import { updateWaMessageId } from "../../crud/conversation";

export async function handleMessage(message: Message) {
  await log(message);
  await setStatusFor(message, "working");
  const streamingReply = await message.reply("...");

  try {
    const context = await createContextFromMessage(message);

    const completion = await getCompletionFor(message, context, streamingReply);
    let response = completion.response;

    if (ENABLE_REMINDERS === "true")
      response = await handleReminderFor(message, completion);

    // TODO: must have a way to select them when replying
    // TODO: maybe they can live in a new whatsapp message (sent immediately after the completion)?
    if (ENABLE_SUGGESTIONS === "true")
      response = response + "\n\n" + getSuggestions(completion);
    if (ENABLE_SOURCES === "true")
      response = response + "\n\n" + getSources(completion);

    const finalReply = await streamingReply.edit(response);

    await log(finalReply, true);
    await setStatusFor(message, "done");
  } catch (error) {
    console.error(error);

    const errorReply = await streamingReply.edit(BOT_PREFIX + error);

    await log(errorReply, true);
    await setStatusFor(message, "error");
  }

  const chat = await message.getChat();

  // The waMessageId is used to track the last completion sent by the bot in the chat (finalReply)
  // Allows the user to get completions from the bot without having to mention it in groups
  // Just gotta reply to this message (finalReply) in a thread
  // streamingReply.id === finalReply.id === errorReply.id
  if (chat.isGroup)
    await updateWaMessageId(chat.id._serialized, streamingReply.id._serialized);
}
