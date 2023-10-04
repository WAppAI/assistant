// see src/types/bing-ai-client.d.ts
// @ts-ignore
import { BingAIClientResponse } from "@waylaidwanderer/chatgpt-api";
import { prisma } from "../clients/prisma";

export async function createConversation(
  completion: BingAIClientResponse,
  messageId: string,
  chatId: string
) {
  return await prisma.bingConversation.create({
    data: {
      id: completion.conversationId,
      clientId: completion.clientId,
      signature: completion.conversationSignature,
      invocationId: completion.invocationId,
      jailbreakId: completion.jailbreakConversationId,
      parentMessageId: completion.messageId,
      expiryTime: completion.conversationExpiryTime,
      waMessageId: messageId,
      waChatId: chatId,
    },
  });
}

export async function deleteAllConversations() {
  await prisma.cache.deleteMany();
  return await prisma.bingConversation.deleteMany();
}

export async function deleteConversation(chatId: string) {
  const conversation = await getConversationFor(chatId);
  if (!conversation) return;

  if (conversation.jailbreakId)
    await prisma.cache.delete({
      where: { key: `bing:${conversation.jailbreakId}` },
    });

  return await prisma.bingConversation.delete({
    where: { waChatId: chatId },
  });
}

export async function getConversationFor(chatId: string) {
  return prisma.bingConversation.findFirst({
    where: { waChatId: chatId },
  });
}
