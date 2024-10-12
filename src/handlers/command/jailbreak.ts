import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { stripIndents } from "common-tags";
import { handleReset } from "./reset";
import { invalidArgumentMessage } from "../../helpers/command";
import { createChat } from "../../crud/chat";
import { getConversationFor } from "../../crud/conversation";
import { proto, WASocket } from "@whiskeysockets/baileys";

type JailbreakArgs = "enable" | "disable" | "on" | "off" | (string & {});

async function setChatJailbroken(chatId: string, jailbroken: boolean) {
  await prisma.bingConversation.update({
    where: { waChatId: chatId },
    data: {
      jailbroken,
    },
  });
}

export async function handleJailbreak(
  message: proto.IWebMessageInfo,
  args: JailbreakArgs,
  sock: WASocket
): Promise<string> {
  const chatId = message.key.remoteJid!;

  if (!args.length) {
    const bingConversation = await prisma.bingConversation.findFirst({
      where: { waChatId: chatId },
      select: { jailbroken: true },
    });
    if (!bingConversation) await createChat(chatId);

    const state = bingConversation?.jailbroken ? "enabled" : "disabled";
    return `${BOT_PREFIX}Jailbreak is currently *${state}* for this chat`;
  }

  const conversation = await getConversationFor(chatId);

  switch (args) {
    case "on":
    case "enable":
      if (conversation && conversation.jailbroken) {
        return `${BOT_PREFIX}Jailbreak already *enabled* for this chat`;
      }

      await setChatJailbroken(chatId, true);
      return `${BOT_PREFIX}Jailbreak *enabled* for this chat`;

    case "off":
    case "disable":
      if (conversation && conversation.jailbroken === false) {
        return `${BOT_PREFIX}Jailbreak already *_disabled_* for this chat`;
      }

      await setChatJailbroken(chatId, false);
      return `${BOT_PREFIX}Jailbreak *_disabled_* for this chat`;

    default:
      return `${BOT_PREFIX}Invalid jailbreak command. Use \`jailbreak on\` or \`jailbreak off\` to change the jailbreak status for this chat.`;
  }
}
