import { Message } from "whatsapp-web.js";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { deleteConversation } from "../../crud/conversation";

type JailbreakArgs = "on" | "off" | (string & {});

async function setChatJailbroken(chatId: string, jailbroken: boolean) {
  await prisma.wAChat.upsert({
    where: { id: chatId },
    update: { jailbroken },
    create: { id: chatId, jailbroken },
  });
}

export async function handleJailbreak(message: Message, args: JailbreakArgs) {
  let reply: Message;
  const chat = await message.getChat();

  if (!args.length) {
    const waChat = await prisma.wAChat.findFirst({
      where: { id: chat.id._serialized },
      select: { jailbroken: true },
    });
    if (!waChat)
      await prisma.wAChat.create({ data: { id: chat.id._serialized } });

    const jailbroken = waChat?.jailbroken
      ? "jailbreak is enabled"
      : "jailbreak is not enabled";
    return (reply = await message.reply(BOT_PREFIX + jailbroken));
  }

  const conversation = await prisma.bingConversation.findFirst({
    where: { waChatId: chat.id._serialized },
  });

  switch (args) {
    case "on":
      if (conversation && !conversation.jailbreakId) {
        await deleteConversation(chat.id._serialized);
        await message.reply(BOT_PREFIX + "deleted this conversation");
      }

      await setChatJailbroken(chat.id._serialized, true);
      reply = await message.reply(BOT_PREFIX + "jailbreak enabled");
      break;
    case "off":
      if (conversation && conversation.jailbreakId) {
        await deleteConversation(chat.id._serialized);
        await message.reply(BOT_PREFIX + "deleted this conversation");
      }

      await setChatJailbroken(chat.id._serialized, false);
      reply = await message.reply(BOT_PREFIX + "jailbreak disabled");
      break;
    default:
      reply = await message.reply(BOT_PREFIX + "unknown argument");
      break;
  }

  return reply;
}
