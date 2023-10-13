import { Message } from "whatsapp-web.js";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { deleteConversation } from "../../crud/conversation";
import { deleteChat } from "../../crud/chat";
import { deleteAllReminder } from "../reminder/utils";

export async function handleReset(message: Message) {
  let reply: Message;

  const chat = await message.getChat();
  const waChat = await prisma.wAChat.findFirst({
    where: { id: chat.id._serialized },
  });

  if (waChat) {
    await deleteAllReminder(message.from);
    await deleteConversation(waChat.id);
    await deleteChat(waChat.id);
    reply = await message.reply(
      `${BOT_PREFIX}Deleted conversation for this chat`
    );
  } else {
    reply = await message.reply(
      `${BOT_PREFIX}No conversation found for this chat`
    );
  }

  return reply;
}
