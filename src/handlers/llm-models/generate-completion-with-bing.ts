import {
  BingAIClientResponse,
  // @ts-ignore
} from "@waylaidwanderer/chatgpt-api";
import { Message } from "whatsapp-web.js";
import {
  createConversation,
  getConversationFor,
} from "../../crud/conversation";
import { createChat, getChatFor } from "../../crud/chat";
import {
  BING_TONESTYLE,
  BOT_PREFIX,
  SYSTEM_MESSAGE,
  TRANSCRIPTION_ENABLED,
} from "../../constants";
import { handleAudioMessage } from "../audio-message";
import { bing } from "../../clients/bing";

export async function generateCompletionWithBing(
  message: Message,
  context: string,
  onProgress: (progress: string) => void
) {
  let completion: BingAIClientResponse;

  const chat = await message.getChat();
  const conversation = await getConversationFor(chat.id._serialized);
  const waChat = await getChatFor(chat.id._serialized);
  let imageBase64: string | undefined;

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

  if (conversation) {
    // If the conversation already exists
    if (waChat?.jailbroken) {
      // If the conversation is jailbroken
      completion = await bing.sendMessage(message.body, {
        jailbreakConversationId: conversation.jailbreakId as string,
        parentMessageId: conversation.parentMessageId as string,
        imageBase64,
        toneStyle: BING_TONESTYLE,
        context,
        onProgress,
      });
    }
    // If the conversation is not jailbroken
    else
      completion = await bing.sendMessage(message.body, {
        encryptedConversationSignature: conversation.encryptedSignature,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        invocationId: conversation.invocationId,
        imageBase64,
        toneStyle: BING_TONESTYLE,
        onProgress,
        // apparently we can't give context to existing conversations when not jailbroken
        // context,
      });
  } else {
    // If the conversation doesn't exist yet
    completion = await bing.sendMessage(message.body, {
      jailbreakConversationId: waChat?.jailbroken !== false,
      systemMessage: waChat?.jailbroken ? SYSTEM_MESSAGE : undefined,
      imageBase64,
      toneStyle: BING_TONESTYLE,
      context,
      onProgress,
    });

    if (!waChat) await createChat(chat.id._serialized); // Creates the chat if it doesn't exist yet

    await createConversation(completion, message.id.id, chat.id._serialized); // Creates the conversation
  }

  return completion;
}
