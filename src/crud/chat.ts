import { prisma } from "../clients/prisma";

export async function getChatFor(chatId: string) {
  return await prisma.wAChat.findFirst({
    where: { id: chatId },
  });
}

export async function createChat(chatId: string) {
  return await prisma.wAChat.create({
    data: { id: chatId },
  });
}
