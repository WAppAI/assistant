import { Message } from "whatsapp-web.js";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { deleteAllConversations, deleteConversation } from "../../crud/conversation";
import { deleteAllChats, deleteChat } from "../../crud/chat";
import { invalidArgumentMessage } from "../../helpers/command";

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
      reply = await message.reply(`${BOT_PREFIX}Deleted *_all_* conversations`);
      break;
    case "":
      if (waChat) {
        await deleteConversation(waChat.id);
        await deleteChat(waChat.id);
        reply = await message.reply(`${BOT_PREFIX}Deleted conversation for this chat`);
        break;
      }

      reply = await message.reply(`${BOT_PREFIX}No ongoing found for this chat`);
      break;
    default:
      reply = await message.reply(invalidArgumentMessage(args, "reset <all>"));
      break;
  }

  return reply;
}
