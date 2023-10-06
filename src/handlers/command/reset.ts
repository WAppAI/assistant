import { Message } from "whatsapp-web.js";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { deleteAllConversations, deleteConversation } from "../../crud/conversation";
import { deleteAllChats, deleteChat } from "../../crud/chat";

type ResetArgs = "all" | (string & {});

export async function handleReset(message: Message, args: ResetArgs) {
  let reply: Message;

  const chat = await message.getChat();
  const waChat = await prisma.wAChat.findFirst({
    where: { id: chat.id._serialized },
  });

  switch (args) {
    case "all": // TODO: only superusers/bot owner should be able to do this
      await deleteAllConversations();
      await deleteAllChats();
      reply = await message.reply(BOT_PREFIX + "deleted all conversations");
      break;
    default:
      if (waChat) {
        await deleteConversation(waChat.id);
        await deleteChat(waChat.id);
        reply = await message.reply(BOT_PREFIX + "deleted this conversation");
        break;
      }

      reply = await message.reply(BOT_PREFIX + "no conversation to delete");
      break;
  }

  return reply;
}
