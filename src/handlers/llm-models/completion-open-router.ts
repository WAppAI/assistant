import { delay, downloadMediaMessage, proto } from "@whiskeysockets/baileys";
import { sock } from "../../clients/whatsapp";
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
import { isGroupMessage } from "../../helpers/message";

export async function getCompletionWithOpenRouter(
  message: proto.IWebMessageInfo,
  context: string,
  streamingReply: proto.IWebMessageInfo
) {
  let tokenBuffer: string[] = ["..."];
  let tokenQueue: string[] = [];
  let messageBody = message.message?.extendedTextMessage?.text || "";

  const chatId = message.key.remoteJid!;
  const waChat = await getChatFor(chatId);
  let imageBase64: string | undefined;
  const conversation = await getOpenRouterConversationFor(chatId);
  const pulseFrequencyInMinutes = PULSE_FREQUENCY / 60000;
  const executor = await createExecutorForOpenRouter(context, chatId);

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
        messageBody = await handleAudioMessage(message, media);
      } else {
        await sock.sendMessage(chatId, {
          text: BOT_PREFIX + "Transcription not enabled",
        });
        return `Transcription not enabled`;
      }
    }
  }

  const response = await executor.invoke(
    {
      input: messageBody,
      ASSISTANT_NAME: ASSISTANT_NAME,
      context: context,
      PULSE_FREQUENCY: `${pulseFrequencyInMinutes} minutes`,
    },
    {
      callbacks: [
        {
          async handleLLMNewToken(token: string) {
            if (STREAM_RESPONSES !== "true" || isGroupMessage(message)) return; //TODO: Re enable streaming responses for group messages

            tokenQueue.push(token);

            if (tokenQueue.length >= 3) {
              tokenBuffer.push(...tokenQueue);
              tokenQueue = [];

              const updatedMessage = tokenBuffer.join("");
              await sock.sendMessage(
                chatId,
                {
                  text: updatedMessage,
                  edit: streamingReply.key,
                },
                { quoted: message }
              );
            }
          },
        },
      ],
    }
  );

  await sock.sendMessage(
    chatId,
    {
      text: response.output,
      edit: streamingReply.key,
    },
    { quoted: message }
  );

  if (!waChat) await createChat(chatId);

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
        chatId,
        JSON.stringify(currentSummaryArray)
      );
    } else {
      await createOpenRouterConversation(
        chatId,
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
        chatId,
        JSON.stringify(chatHistoryArray)
      );
    } else {
      await createOpenRouterConversation(
        chatId,
        JSON.stringify(chatHistoryArray)
      );
    }
  }

  return response.output;
}
