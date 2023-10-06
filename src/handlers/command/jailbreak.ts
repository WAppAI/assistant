import { Message } from "whatsapp-web.js";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { stripIndents } from "common-tags";
import { handleReset } from "./reset";
import { invalidArgumentMessage } from "../../helpers/command";
import { createChat } from "../../crud/chat";
import { getConversationFor } from "../../crud/conversation";

type JailbreakArgs = "enable" | "disable" | "on" | "off" | (string & {});

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
    if (!waChat) await createChat(chat.id._serialized);

    const state = waChat?.jailbroken ? "enabled" : "disabled";

    return (reply = await message.reply(
      stripIndents`${BOT_PREFIX}Jailbreak is currently *_${state}_* for this chat`
    ));
  }

  const conversation = await getConversationFor(chat.id._serialized);

  switch (args) {
    case "on" || "enable":
      if (conversation && !conversation.jailbreakId) {
        // await deleteConversation(chat.id._serialized);
        // await message.reply( stripIndents`${BOT_PREFIX}Deleted the ongoing conversation for this chat`);
        await handleReset(message);
      }

      await setChatJailbroken(chat.id._serialized, true);
      reply = await message.reply(`${BOT_PREFIX}Jailbreak *_enabled_* for this chat`);
      break;
    case "off" || "disable":
      if (conversation && conversation.jailbreakId) {
        // await deleteConversation(chat.id._serialized);
        // await message.reply(BOT_PREFIX + "deleted this conversation");
        await handleReset(message);
      }

      await setChatJailbroken(chat.id._serialized, false);
      reply = await message.reply(`${BOT_PREFIX}Jailbreak *_disabled_* for this chat`);
      break;
    default:
      reply = await message.reply(
        invalidArgumentMessage(args, "jailbreak <enable|disable|on|off>")
      );
      break;
  }

  return reply;
}
