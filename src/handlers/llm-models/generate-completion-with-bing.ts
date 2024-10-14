// @ts-ignore
import { BingAIClientResponse } from "@waylaidwanderer/chatgpt-api";
import { downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import { bing } from "../../clients/bing";
import {
  BING_SYSTEM_MESSAGE,
  BING_TONESTYLE,
  BOT_PREFIX,
  TRANSCRIPTION_ENABLED,
} from "../../constants";
import { createChat, getChatFor } from "../../crud/chat";
import {
  createConversation,
  getConversationFor,
} from "../../crud/conversation";
import { handleAudioMessage } from "../audio-message";
import { sock } from "../../clients/whatsapp";

export async function generateCompletionWithBing(
  message: proto.IWebMessageInfo,
  context: string,
  onProgress: (progress: string) => void
) {
  let completion: BingAIClientResponse;

  const chatId = message.key.remoteJid!;
  const conversation = await getConversationFor(chatId);
  const waChat = await getChatFor(chatId);
  let imageBase64: string | undefined;

  if (message.message?.imageMessage || message.message?.audioMessage) {
    const media = await downloadMediaMessage(message, "buffer", {});
    const mimetype =
      message.message?.imageMessage?.mimetype ||
      message.message?.audioMessage?.mimetype;

    const isImage = mimetype?.includes("image");
    const isAudio = mimetype?.includes("audio");

    if (isImage) {
      imageBase64 = media.toString("base64"); // Ensure proper encoding
    }

    if (isAudio) {
      if (TRANSCRIPTION_ENABLED === "true") {
        message.message.conversation = await handleAudioMessage(message, media);
      } else {
        // Handle the case when transcription is not enabled
        await sock.sendMessage(chatId, {
          text: BOT_PREFIX + "Transcription not enabled",
        });
        throw new Error("Transcription not enabled");
      }
    }
  }

  if (conversation) {
    // If the conversation already exists
    if (conversation?.jailbroken) {
      // If the conversation is jailbroken
      completion = await bing.sendMessage(
        message.message?.extendedTextMessage?.text || "",
        {
          jailbreakConversationId: conversation.jailbreakId as string,
          parentMessageId: conversation.parentMessageId as string,
          imageBase64,
          toneStyle: BING_TONESTYLE,
          context,
          onProgress,
        }
      );
    } else {
      // If the conversation is not jailbroken
      completion = await bing.sendMessage(
        message.message?.extendedTextMessage?.text || "",
        {
          encryptedConversationSignature: conversation.encryptedSignature,
          conversationId: conversation.waChatId,
          clientId: conversation.clientId,
          invocationId: conversation.invocationId,
          imageBase64,
          toneStyle: BING_TONESTYLE,
          onProgress,
          // apparently we can't give context to existing conversations when not jailbroken
          // context,
        }
      );
    }
  } else {
    // If the conversation doesn't exist yet
    completion = await bing.sendMessage(
      message.message?.extendedTextMessage?.text || "",
      {
        jailbreakConversationId: true,
        systemMessage: BING_SYSTEM_MESSAGE,
        imageBase64,
        toneStyle: BING_TONESTYLE,
        context,
        onProgress,
      }
    );

    if (!waChat) await createChat(chatId); // Creates the chat if it doesn't exist yet

    await createConversation(completion, message.key.id!, chatId); // Creates the conversation
  }

  return completion;
}
