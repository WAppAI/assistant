import { proto, WASocket, downloadMediaMessage } from "@whiskeysockets/baileys";
import { createExecutorForOpenRouter } from "../../clients/open-router";
import {
  ASSISTANT_NAME,
  BOT_PREFIX,
  DEBUG_SUMMARY,
  OPENROUTER_MEMORY_TYPE,
  PULSE_FREQUENCY,
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
  sock: WASocket,
  message: proto.IWebMessageInfo,
  context: string,
  streamingReply: proto.IWebMessageInfo
) {
  let tokenBuffer: string[] = ["..."];

  const chatId = message.key.remoteJid!;
  const chat = await sock.groupMetadata(chatId);
  const waChat = await getChatFor(chat.id);
  let imageBase64: string | undefined;
  const conversation = await getOpenRouterConversationFor(chat.id);
  const pulseFrequencyInMinutes = PULSE_FREQUENCY / 60000;
  const executor = await createExecutorForOpenRouter(context, chat.id);

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
        message.message.conversation = await handleAudioMessage(
          message,
          sock,
          media
        );
      } else {
        await sock.sendMessage(chatId, {
          text: BOT_PREFIX + "Transcription not enabled",
        });
        throw new Error("Transcription not enabled");
      }
    }
  }

  const response = await executor.invoke(
    {
      input: message.message?.conversation || "",
      ASSISTANT_NAME: ASSISTANT_NAME,
      context: context,
      PULSE_FREQUENCY: `${pulseFrequencyInMinutes} minutes`,
    },
    {
      callbacks: [
        {
          async handleLLMNewToken(token: string) {
            if (STREAM_RESPONSES !== "true") return;

            tokenBuffer.push(token);
            const updatedMessage = tokenBuffer.join("");

            await sock.sendMessage(chatId, {
              text: updatedMessage,
            });
          },
        },
      ],
    }
  );

  if (!waChat) await createChat(chat.id);

  if (OPENROUTER_MEMORY_TYPE === "summary") {
    let currentSummaryRaw = await executor.memory?.loadMemoryVariables({});
    let currentSummary = currentSummaryRaw?.chat_history || [];

    let currentSummaryArray = currentSummary.map((msg: any) => ({
      [msg.constructor.name]: msg.content,
    }));

    if (DEBUG_SUMMARY === "true") {
      console.log("Current summary: ", currentSummaryArray);
    }

    if (conversation) {
      await updateOpenRouterConversation(
        chat.id,
        JSON.stringify(currentSummaryArray)
      );
    } else {
      await createOpenRouterConversation(
        chat.id,
        JSON.stringify(currentSummaryArray)
      );
    }
  } else {
    let chatHistoryRaw = await executor.memory?.loadMemoryVariables({});
    let chatHistory = chatHistoryRaw?.chat_history || [];

    let chatHistoryArray = chatHistory.map((msg: any) => ({
      [msg.constructor.name]: msg.content,
    }));

    if (conversation) {
      await updateOpenRouterConversation(
        chat.id,
        JSON.stringify(chatHistoryArray)
      );
    } else {
      await createOpenRouterConversation(
        chat.id,
        JSON.stringify(chatHistoryArray)
      );
    }
  }

  return response.output;
}
