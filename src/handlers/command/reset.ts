import { Message } from "whatsapp-web.js";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { deleteConversation } from "../../crud/conversation";

type ResetArgs = "all" | (string & {});

export async function handleReset(message: Message, args: ResetArgs) {
  let reply: Message;

  switch (args) {
    case "all":
      await prisma.bingConversation.deleteMany();
      reply = await message.reply(BOT_PREFIX + "deleted all conversations");
      break;
    default:
      const chat = await message.getChat();
      const conversation = await prisma.bingConversation.findFirst({
        where: { waChatId: chat.id._serialized },
      });

      if (conversation) {
        await deleteConversation(chat.id._serialized);
        reply = await message.reply(BOT_PREFIX + "deleted this conversation");
        break;
      }

      reply = await message.reply(BOT_PREFIX + "no conversation to delete");
      break;
  }

  return reply;
}
