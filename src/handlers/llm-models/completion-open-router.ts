import { Message } from "whatsapp-web.js";
import { createChainForOpenRouter } from "../../clients/open-router";
import {
  BOT_PREFIX,
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
  const chain = await createChainForOpenRouter(context, chat.id._serialized);

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

  let response = await chain.call(
    { input: message.body },
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

  let chatistoryRaw = await chain.memory?.loadMemoryVariables({});
  let chatHistory: string = chatistoryRaw?.chat_history;

  if (conversation) {
    await updateOpenRouterConversation(chat.id._serialized, chatHistory); // Updates the conversation
  } else {
    await createOpenRouterConversation(chat.id._serialized, chatHistory); // Creates the conversation
  }

  return response.text;
}
