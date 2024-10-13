import { proto, WAMessage } from "@whiskeysockets/baileys";
import { sock } from "../../clients/new-whatsapp.ts";
import {
  BOT_PREFIX,
  DEFAULT_MODEL,
  ENABLE_REMINDERS,
  ENABLE_SOURCES,
  ENABLE_SUGGESTIONS,
} from "../../constants";
import { getLLMModel, updateWaMessageId } from "../../crud/conversation";
import { createContextFromMessage } from "../context";
import {
  getCompletionWithBing,
  getSources,
  getSuggestions,
} from "../llm-models/completion-bing.ts";
import { getCompletionWithOpenRouter } from "../llm-models/completion-open-router.ts";
import { react } from "../reactions.ts";
import { handleReminderFor } from "../reminder/reminder.ts";

export async function handleMessage(message: WAMessage) {
  await react(message, "working");

  const chatId = message.key.remoteJid;
  if (!chatId) {
    throw new Error("Invalid chat ID");
  }

  const isGroup = chatId.endsWith("@g.us");
  const streamingReply = await sock.sendMessage(
    chatId,
    { text: "..." },
    { quoted: message }
  );
  let llmModel = await getLLMModel(chatId);

  if (!llmModel) {
    llmModel = DEFAULT_MODEL;
  }

  let response: string | null;

  try {
    const context = await createContextFromMessage(message);

    if (llmModel === "bing") {
      const completion = await getCompletionWithBing(
        message,
        context,
        streamingReply as proto.IWebMessageInfo
      );
      response = completion.response;

      if (ENABLE_REMINDERS === "true") {
        response = await handleReminderFor(message, completion.response);
      }

      if (ENABLE_SUGGESTIONS === "true") {
        response = response + "\n\n" + getSuggestions(completion);
      }
      if (ENABLE_SOURCES === "true") {
        response = response + "\n\n" + getSources(completion);
      }
    } else {
      response = await getCompletionWithOpenRouter(
        message,
        context,
        streamingReply as proto.IWebMessageInfo
      );
    }

    if (!response) throw new Error("No response from LLM");

    try {
      console.log("Editing message:", response);
      await sock.sendMessage(
        chatId,
        { text: response, edit: streamingReply?.key },
        { quoted: message }
      );
    } catch (error) {
      console.error("Failed to edit message:", error);
    }

    await react(message, "done");
  } catch (error) {
    console.error(error);

    const errorReply = await sock.sendMessage(chatId, {
      text: BOT_PREFIX + (error as Error).message,
    });

    await react(message, "error");
  }

  if (isGroup && llmModel === "bing" && streamingReply?.key?.id) {
    await updateWaMessageId(chatId, streamingReply.key.id);
  }
}
