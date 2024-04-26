import { prisma } from "../clients/prisma";
import { DEFAULT_MODEL } from "../constants";

export async function getChatFor(chatId: string) {
  return await prisma.wAChat.findFirst({
    where: { id: chatId },
  });
}

export async function createChat(chatId: string) {
  return await prisma.wAChat.create({
    data: { id: chatId, llmModel: DEFAULT_MODEL },
  });
}

export async function deleteChat(chatId: string) {
  return await prisma.wAChat.delete({
    where: { id: chatId },
  });
}

export async function deleteAllChats() {
  return await prisma.wAChat.deleteMany();
}
