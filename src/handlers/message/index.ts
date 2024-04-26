import { Message } from "whatsapp-web.js";
import {
  BOT_PREFIX,
  DEFAULT_MODEL,
  ENABLE_REMINDERS,
  ENABLE_SOURCES,
  ENABLE_SUGGESTIONS,
  OPENROUTER_API_KEY,
} from "../../constants";
import { getLLMModel, updateWaMessageId } from "../../crud/conversation";
import { setStatusFor } from "../../helpers/message";
import { log } from "../../helpers/utils";
import { createContextFromMessage } from "../context";
import {
  getCompletionWithBing,
  getSources,
  getSuggestions,
} from "../llm-models/completion-bing.ts";
import { getCompletionWithOpenRouter } from "../llm-models/completion-open-router.ts";
import { handleReminderFor } from "../reminder/reminder.ts";

export async function handleMessage(message: Message) {
  await log(message);
  await setStatusFor(message, "working");
  const chat = await message.getChat();
  const streamingReply = await message.reply("...");
  let llmModel = await getLLMModel(chat.id._serialized);
  if (!llmModel) {
    llmModel = DEFAULT_MODEL;
  }
  let response: string | null;

  try {
    const context = await createContextFromMessage(message);

    if (llmModel !== "bing" && OPENROUTER_API_KEY !== "") {
      response = await getCompletionWithOpenRouter(
        message,
        context,
        streamingReply
      );
    } else {
      const completion = await getCompletionWithBing(
        message,
        context,
        streamingReply
      );
      response = completion.response;

      if (ENABLE_REMINDERS === "true")
        response = await handleReminderFor(message, completion.response);

      // TODO: must have a way to select them when replying
      // TODO: maybe they can live in a new whatsapp message (sent immediately after the completion)?
      if (ENABLE_SUGGESTIONS === "true")
        response = response + "\n\n" + getSuggestions(completion);
      if (ENABLE_SOURCES === "true")
        response = response + "\n\n" + getSources(completion);
    }

    if (!response) throw new Error("No response from LLM");

    let finalReply = null;

    while (finalReply === null) {
      finalReply = await streamingReply.edit(response);
    }

    await log(finalReply, true);
    await setStatusFor(message, "done");
  } catch (error) {
    console.error(error);

    const errorReply = await streamingReply.edit(BOT_PREFIX + error);

    await log(errorReply, true);
    await setStatusFor(message, "error");
  }

  // The waMessageId is used to track the last completion sent by the bot in the chat (finalReply)
  // Allows the user to get completions from the bot without having to mention it in groups
  // Just gotta reply to this message (finalReply) in a thread
  // streamingReply.id === finalReply.id === errorReply.id
  if (chat.isGroup)
    if (llmModel === "bing")
      await updateWaMessageId(
        chat.id._serialized,
        streamingReply.id._serialized
      );
}
