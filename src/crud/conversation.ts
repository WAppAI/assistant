// see src/types/bing-ai-client.d.ts
// @ts-ignore
import { BingAIClientResponse } from "@waylaidwanderer/chatgpt-api";
import { prisma } from "../clients/prisma";
import { BingConversation, OpenRouterConversation } from "@prisma/client";

export async function createConversation(
  completion: BingAIClientResponse,
  messageId: string,
  chatId: string
) {
  return await prisma.bingConversation.create({
    data: {
      clientId: completion.clientId,
      encryptedSignature: completion.encryptedConversationSignature,
      invocationId: completion.invocationId,
      jailbreakId: completion.jailbreakConversationId,
      parentMessageId: completion.messageId,
      expiryTime: completion.conversationExpiryTime,
      waMessageId: messageId,
      waChatId: chatId,
    },
  });
}

export async function createOpenRouterConversation(
  chatId: string,
  memory: string
) {
  return await prisma.openRouterConversation.create({
    data: {
      waChatId: chatId,
      memory: memory,
    },
  });
}

export async function deleteAllConversations() {
  await prisma.cache.deleteMany();
  return await prisma.bingConversation.deleteMany();
}

export async function deleteBingConversation(
  chatId: string,
  conversation: BingConversation
) {
  if (conversation.jailbreakId)
    await prisma.cache.delete({
      where: { key: `bing:${conversation.jailbreakId}` },
    });

  return await prisma.bingConversation.delete({
    where: { waChatId: chatId },
  });
}

export async function deleteOpenRouterConversation(chatId: string) {
  return await prisma.openRouterConversation.delete({
    where: { waChatId: chatId },
  });
}

export async function getConversationFor(chatId: string) {
  return prisma.bingConversation.findFirst({
    where: { waChatId: chatId },
  });
}

export async function getOpenRouterConversationFor(chatId: string) {
  return prisma.openRouterConversation.findFirst({
    where: { waChatId: chatId },
  });
}

export async function getOpenRouterMemoryFor(chatId: string) {
  const conversation = await getOpenRouterConversationFor(chatId);
  return conversation?.memory;
}

export async function updateWaMessageId(chatId: string, waMessageId: string) {
  const conversation = await getConversationFor(chatId);
  await prisma.bingConversation.update({
    data: { waMessageId },
    where: { waChatId: conversation?.waChatId },
  });
}

export async function getWAChat(id: string) {
  return await prisma.wAChat.findFirst({
    where: { id },
  });
}

export async function getLLMModel(chatId: string) {
  const conversation = await getWAChat(chatId);
  return conversation?.llmModel;
}

export async function updateLLMModel(chatId: string, llmModel: string) {
  const conversation = await getWAChat(chatId);
  await prisma.wAChat.update({
    data: { llmModel },
    where: { id: conversation?.id },
  });
}

export async function updateOpenRouterConversation(
  chatId: string,
  memory: string
) {
  return await prisma.openRouterConversation.update({
    data: {
      waChatId: chatId,
      memory: memory,
    },
    where: {
      waChatId: chatId,
    },
  });
}

export async function getCoreMemoryFor(chatId: string): Promise<string | null> {
  const conversation = await prisma.openRouterConversation.findFirst({
    where: { waChatId: chatId },
  });
  return conversation?.coreMemory || null;
}

export async function updateCoreMemory(
  chatId: string,
  coreMemory: string
): Promise<void> {
  await prisma.openRouterConversation.update({
    data: { coreMemory },
    where: { waChatId: chatId },
  });
}
