import { proto, WAMessage, WASocket } from "@whiskeysockets/baileys";
import {
  BOT_PREFIX,
  DEFAULT_MODEL,
  ENABLE_REMINDERS,
  ENABLE_SOURCES,
  ENABLE_SUGGESTIONS,
  OPENROUTER_API_KEY,
} from "../../constants";
import { getLLMModel, updateWaMessageId } from "../../crud/conversation";
import { createContextFromMessage } from "../context";
import {
  getCompletionWithBing,
  getSources,
  getSuggestions,
} from "../llm-models/completion-bing.ts";
import { getCompletionWithOpenRouter } from "../llm-models/completion-open-router.ts";
import { handleReminderFor } from "../reminder/reminder.ts";
import { react } from "../reactions.ts";

export async function handleMessage(sock: WASocket, message: WAMessage) {
  await react(message, "working");

  const chatId = message.key.remoteJid;
  if (!chatId) {
    throw new Error("Invalid chat ID");
  }

  const isGroup = chatId.endsWith("@g.us");
  const streamingReply = await sock.sendMessage(chatId, { text: "..." });
  let llmModel = await getLLMModel(chatId);

  if (!llmModel) {
    llmModel = DEFAULT_MODEL;
  }

  let response: string | null;

  try {
    const context = await createContextFromMessage(message, sock);

    if (llmModel !== "bing" && OPENROUTER_API_KEY !== "") {
      response = await getCompletionWithOpenRouter(
        sock,
        message,
        context,
        streamingReply as proto.IWebMessageInfo
      );
    } else {
      const completion = await getCompletionWithBing(
        sock,
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
    }

    if (!response) throw new Error("No response from LLM");

    let finalReply = null;
    while (finalReply === null) {
      finalReply = await sock.sendMessage(chatId, { text: response });
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
  } else {
    console.error("Failed to update message ID");
  }
}
