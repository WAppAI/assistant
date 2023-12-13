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
  await prisma.bingConversation.update({
    where: { waChatId: chatId },
    data: {
      jailbroken,
    },
  });
}

export async function handleJailbreak(message: Message, args: JailbreakArgs) {
  let reply: Message;
  const chat = await message.getChat();

  if (!args.length) {
    const bingConversation = await prisma.bingConversation.findFirst({
      where: { waChatId: chat.id._serialized },
      select: { jailbroken: true },
    });
    if (!bingConversation) await createChat(chat.id._serialized);

    const state = bingConversation?.jailbroken ? "enabled" : "disabled";

    return (reply = await message.reply(
      stripIndents`${BOT_PREFIX}Jailbreak is currently *_${state}_* for this chat`
    ));
  }

  const conversation = await getConversationFor(chat.id._serialized);

  switch (args) {
    case "on" || "enable":
      /*if (conversation && !conversation.jailbreakId) {          **NO IDEA WHY THIS IS HERE @veigamann go fuck yourself**
         await deleteConversation(chat.id._serialized);
         await message.reply( stripIndents`${BOT_PREFIX}Deleted the ongoing conversation for this chat`);
         await handleReset(message);
      }*/

      if (conversation && conversation.jailbroken) {
        reply = await message.reply(
          `${BOT_PREFIX}Jailbreak already *_enabled_* for this chat`
        );
        return reply;
      }

      await setChatJailbroken(chat.id._serialized, true);
      reply = await message.reply(
        `${BOT_PREFIX}Jailbreak *_enabled_* for this chat`
      );
      break;
    case "off" || "disable":
      /*if (conversation && conversation.jailbreakId) {         **NO IDEA WHY THIS IS HERE @veigamann go fuck yourself**
        // await deleteConversation(chat.id._serialized);
        // await message.reply(BOT_PREFIX + "deleted this conversation");
        await handleReset(message);
      }*/

      if (conversation && conversation.jailbroken === false) {
        reply = await message.reply(
          `${BOT_PREFIX}Jailbreak already *_disabled_* for this chat`
        );
        return reply;
      }

      await setChatJailbroken(chat.id._serialized, false);
      reply = await message.reply(
        `${BOT_PREFIX}Jailbreak *_disabled_* for this chat`
      );
      break;
    default:
      reply = await message.reply(
        invalidArgumentMessage(args, "jailbreak <enable|disable|on|off>")
      );
      break;
  }

  return reply;
}
