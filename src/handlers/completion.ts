// see src/types/bing-ai-client.d.ts
import type {
  BingAIClientResponse,
  SourceAttribution,
  SuggestedResponse,
} from "@waylaidwanderer/chatgpt-api";

import { Message } from "whatsapp-web.js";
import { bing } from "../clients/bing";
import {
  BOT_PREFIX,
  STREAM_REMINDERS,
  STREAM_RESPONSES,
  SYSTEM_MESSAGE,
  TRANSCRIPTION_ENABLED,
} from "../constants";
import { createChat, getChatFor } from "../crud/chat";
import { createConversation, getConversationFor } from "../crud/conversation";
import { handleAudioMessage } from "./audio-message";

export async function getCompletionFor(
  message: Message,
  context: string,
  streamingReply: Message
) {
  let streamingReplyBody = streamingReply.body;
  let tokenQueue: string[] = [];
  let isProcessingQueue = false;
  let isEditingReply: Promise<Message | null>;
  let isReminder = false;

  async function onTokenStream(token: string) {
    if (STREAM_RESPONSES !== "true") return;
    const isWebSearch =
      token.startsWith("Searching") && tokenQueue.length === 0;
    if (isWebSearch) token = ` ${token} ...\n\n`; // Formats the web search message nicely

    // Avoids reminders being shown to the user as they're being generated
    if (!isReminder) isReminder = token.startsWith("{");
    if (isReminder && STREAM_REMINDERS !== "true") return;

    tokenQueue.push(token);

    if (!isProcessingQueue) {
      isProcessingQueue = true;
      await processTokenQueue();
    }
  }

  async function processTokenQueue() {
    if (tokenQueue.length !== 0) {
      const token = tokenQueue[0];
      const newReplyContent = streamingReplyBody + token;
      isEditingReply = streamingReply.edit(newReplyContent);
      streamingReplyBody = newReplyContent;

      tokenQueue.shift(); // Removes the processed token from the queue

      await processTokenQueue(); // Continues processing the queue
    } else {
      isProcessingQueue = false;
    }
  }

  const completion = await generateCompletionFor(
    message,
    context,
    onTokenStream
  );
  completion.response = removeFootnotes(completion.response);

  // This is needed to make sure that the last edit to the reply is actually
  // the formatted completion.response, and not some random edit by the queue processing
  // ts-ignore is not ideal but it's what we've got for now
  // @ts-ignore
  return Promise.all([completion, isEditingReply]).then(
    ([completion]) => completion
  );
}

async function generateCompletionFor(
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
    if (waChat?.jailbroken)
      // If the conversation is jailbroken
      completion = await bing.sendMessage(message.body, {
        jailbreakConversationId: conversation.jailbreakId as string,
        parentMessageId: conversation.parentMessageId as string,
        imageBase64,
        toneStyle: "precise",
        context,
        onProgress,
      });
    // If the conversation is not jailbroken
    else
      completion = await bing.sendMessage(message.body, {
        encryptedConversationSignature: conversation.encryptedSignature,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        invocationId: conversation.invocationId,
        imageBase64,
        toneStyle: "precise",
        onProgress,
        // apparently we can't give context to existing conversations when not jailbroken
        // context,
      });
  } else {
    // If the conversation doesn't exist yet
    completion = await bing.sendMessage(message.body, {
      jailbreakConversationId: waChat?.jailbroken ? true : undefined,
      systemMessage: waChat?.jailbroken ? SYSTEM_MESSAGE : undefined,
      imageBase64,
      toneStyle: "precise",
      context,
      onProgress,
    });

    if (!waChat) await createChat(chat.id._serialized); // Creates the chat if it doesn't exist yet

    await createConversation(completion, message.id.id, chat.id._serialized); // Creates the conversation
  }

  return completion;
}

export function getSuggestions(completion: BingAIClientResponse) {
  const suggestions = completion.details.suggestedResponses;

  // All the suggested responses enumerated, eg: "Suggestions\n\n1. Suggestion 1\n2. Suggestion 2"
  const suggestionsList = suggestions.map(
    (suggestion: SuggestedResponse, i: number) => `${i + 1}. ${suggestion.text}`
  );

  return (
    (suggestionsList.length &&
      "*Suggested responses:*\n" + suggestionsList.join("\n")) ||
    ""
  );
}

export function getSources(completion: BingAIClientResponse) {
  const sources = completion.details.sourceAttributions;

  // All the sources enumerated, eg: "Sources\n\n1. Source 1\n2. Source 2"
  const sourcesList = sources.map(
    (source: SourceAttribution, i: number) => `${i + 1}. ${source.seeMoreUrl}`
  );

  return (sourcesList.length && "*Sources:*\n" + sourcesList.join("\n")) || "";
}

function removeFootnotes(text: string): string {
  // Use a regular expression to match and remove the "[^x^]" pattern, where x is a number.
  const cleanedText = text.replace(/\[\^\d+\^\]/g, "");

  return cleanedText;
}
