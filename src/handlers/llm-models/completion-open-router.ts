import { Message } from "whatsapp-web.js";
import {
  createChainForOpenRouter,
  createMemoryForOpenRouter,
} from "../../clients/open-router";
import { STREAM_RESPONSES } from "../../constants";
import { createChat, getChatFor } from "../../crud/chat";
import {
  createOpenRouterConversation,
  getOpenRouterConversationFor,
  updateOpenRouterConversation,
} from "../../crud/conversation";

export async function getCompletionWithOpenRouter(
  message: Message,
  context: string,
  streamingReply: Message
) {
  let messageWithContext = message.body;
  let tokenBuffer: string[] = ["..."];

  const chat = await message.getChat();
  const waChat = await getChatFor(chat.id._serialized);
  const conversation = await getOpenRouterConversationFor(chat.id._serialized);

  if (conversation) await createMemoryForOpenRouter(chat.id._serialized);

  const chain = await createChainForOpenRouter(context);

  let response = await chain.call(
    { input: messageWithContext },
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

  let currentSummaryRaw = await chain.memory?.loadMemoryVariables({});
  let currentSummary = currentSummaryRaw?.chat_history;

  console.log("Current summary: ", currentSummary);

  if (!conversation)
    await createOpenRouterConversation(chat.id._serialized, currentSummary);
  // Creates the conversation
  else await updateOpenRouterConversation(chat.id._serialized, currentSummary); // Updates the conversation

  return response.text;
}
