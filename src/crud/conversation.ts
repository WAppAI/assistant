import { prisma } from "../clients/prisma";

export async function deleteConversation(chatId: string) {
  const conversation = await prisma.bingConversation.delete({
    where: { waChatId: chatId },
    select: { jailbreakId: true },
  });

  if (conversation.jailbreakId)
    await prisma.cache.delete({
      where: { key: `bing:${conversation.jailbreakId}` },
    });
}
