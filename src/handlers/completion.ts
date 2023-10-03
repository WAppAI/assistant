// see src/types/bing-ai-client.d.ts
// @ts-ignore
import type { BingAIClientResponse, SuggestedResponse } from "@waylaidwanderer/chatgpt-api";

// see src/types/bing-ai-client.d.ts
// @ts-ignore
import type { SourceAttribution } from "@waylaidwanderer/chatgpt-api";

import { Message } from "whatsapp-web.js";
import { prisma } from "../clients/prisma";
import { bing } from "../clients/bing";
import { SYSTEM_MESSAGE } from "../constants";
import { createConversation, getConversationFor } from "../crud/conversation";
import { createChat, getChatFor } from "../crud/chat";

export async function getCompletionFor(message: Message, context: string, reply: Message) {
  let replyContent = reply.body;
  let queue: string[] = []; // Create a queue to store tokens
  let processing = false; // Flag to indicate if processing is ongoing
  let replyEditing: Promise<Message | null>; // Flag to indicate if the reply is being edited

  async function onProgress(token: string) {
    const firstReplace = token.startsWith("Searching") && queue.length === 0;
    if (firstReplace) token = ` ${token} ...\n\n`;

    queue.push(token); // Add tokens to the queue
    if (!processing) {
      processing = true;
      await processTokenQueue(); // Start processing the queue
    }
  }

  async function processTokenQueue() {
    if (queue.length !== 0) {
      const token = queue[0];
      const newReplyContent = replyContent + token;
      replyEditing = reply.edit(newReplyContent);
      replyContent = newReplyContent;
      queue.shift(); // Remove the processed token from the queue
      await processTokenQueue(); // Continue processing the queue
    } else {
      processing = false; // Reset the processing flag
    }
  }

  const completion = await generateCompletionFor(message, context, onProgress);
  completion.response = removeFootnotes(completion.response);
  completion.response = completion.response + "\n\n" + getSources(completion);

  // TODO: suggestions will be added later; must have a way to select them when replying
  // completion.response = completion.response + "\n\n" + getSuggestions(completion);

  // @ts-ignore
  return Promise.all([completion, replyEditing]).then(([completion]) => completion);
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

  if (conversation) {
    await prisma.bingConversation.update({
      data: { waMessageId: message.id.id },
      where: { waChatId: conversation.waChatId },
    });

    if (waChat?.jailbroken)
      completion = await bing.sendMessage(message.body, {
        jailbreakConversationId: conversation.jailbreakId as string,
        parentMessageId: conversation.parentMessageId as string,
        toneStyle: "creative",
        context,
        onProgress,
      });
    else
      completion = await bing.sendMessage(message.body, {
        conversationSignature: conversation.signature,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        invocationId: conversation.invocationId,
        toneStyle: "creative",
        onProgress,
        // apparently we can't give context to existing conversations when not jailbroken
        // context,
      });
  } else {
    completion = await bing.sendMessage(message.body, {
      jailbreakConversationId: waChat?.jailbroken ? true : undefined,
      systemMessage: waChat?.jailbroken ? SYSTEM_MESSAGE : undefined,
      toneStyle: "creative",
      context,
      onProgress,
    });

    if (!waChat) await createChat(chat.id._serialized);

    await createConversation(completion, message.id.id, chat.id._serialized);
  }

  return completion;
}

function getSuggestions(completion: BingAIClientResponse) {
  const suggestions = completion.details.suggestedResponses;

  // All the suggested responses enumerated, eg: "Suggestions\n\n1. Suggestion 1\n2. Suggestion 2"
  const suggestionsList = suggestions.map(
    (suggestion: SuggestedResponse, i: number) => `${i + 1}. ${suggestion.text}`
  );

  return (suggestionsList.length && "*Suggested responses:*\n" + suggestionsList.join("\n")) || "";
}

function getSources(completion: BingAIClientResponse) {
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
