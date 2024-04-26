import { Message } from "whatsapp-web.js";
import { createExecutorForOpenRouter } from "../../clients/open-router";
import {
  ASSISTANT_NAME,
  BOT_PREFIX,
  DEBUG_SUMMARY,
  OPENROUTER_MEMORY_TYPE,
  STREAM_RESPONSES,
  TRANSCRIPTION_ENABLED,
} from "../../constants";
import { createChat, getChatFor } from "../../crud/chat";
import {
  createOpenRouterConversation,
  getOpenRouterConversationFor,
  updateOpenRouterConversation,
} from "../../crud/conversation";
import { handleAudioMessage } from "../audio-message";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export async function getCompletionWithOpenRouter(
  message: Message,
  context: string,
  streamingReply: Message
) {
  let tokenBuffer: string[] = ["..."];

  const chat = await message.getChat();
  const waChat = await getChatFor(chat.id._serialized);
  let imageBase64: string | undefined;
  const conversation = await getOpenRouterConversationFor(chat.id._serialized);
  const executor = await createExecutorForOpenRouter(
    context,
    chat.id._serialized
  );

  if (message.hasMedia) {
    const media = await message.downloadMedia();
    const mimetype = media.mimetype;

    const isImage = mimetype?.includes("image");
    const isAudio = mimetype?.includes("audio");

    if (isImage) imageBase64 = media.data;
    if (isAudio) {
      if (TRANSCRIPTION_ENABLED === "true") {
        message.body = await handleAudioMessage(media, message);
      } else {
        // Handle the case when transcription is not enabled
        message.reply(BOT_PREFIX + "Transcription not enabled");
        throw new Error("Transcription not enabled");
      }
    }
  }

  const response = await executor.invoke(
    {
      input: message.body,
      ASSISTANT_NAME: ASSISTANT_NAME,
    },
    {
      callbacks: [
        {
          async handleLLMNewToken(token: string) {
            if (STREAM_RESPONSES !== "true") return;

            // Buffer the token
            tokenBuffer.push(token);

            // Update streamingReply with buffered tokens
            const updatedMessage = tokenBuffer.join("");

            // Edit the streamingReply with the updated message
            await streamingReply.edit(updatedMessage);
          },
        },
      ],
    }
  );

  if (!waChat) await createChat(chat.id._serialized); // Creates the chat if it doesn't exist yet

  if (OPENROUTER_MEMORY_TYPE === "summary") {
    let currentSummaryRaw = await executor.memory?.loadMemoryVariables({});
    let currentSummary = currentSummaryRaw?.chat_history;

    if (DEBUG_SUMMARY === "true") {
      console.log("Current summary: ", currentSummary);
    }

    if (conversation) {
      await updateOpenRouterConversation(chat.id._serialized, currentSummary); // Updates the conversation
    } else {
      await createOpenRouterConversation(chat.id._serialized, currentSummary); // Creates the conversation
    }
  } else {
    let chatHistoryRaw = await executor.memory?.loadMemoryVariables({});
    let chatHistory: any[] = chatHistoryRaw?.chat_history;

    let chatHistoryArray = chatHistory.map((message) => {
      return {
        [message.constructor.name]: message.content,
      };
    });

    console.log("Chat history: ", chatHistoryArray);

    if (conversation) {
      await updateOpenRouterConversation(
        chat.id._serialized,
        JSON.stringify(chatHistoryArray)
      ); // Updates the conversation
    } else {
      await createOpenRouterConversation(
        chat.id._serialized,
        JSON.stringify(chatHistoryArray)
      ); // Creates the conversation
    }
  }

  return response.output;
}
