import { proto, WASocket } from "@whiskeysockets/baileys";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";
import { deleteChat } from "../../crud/chat";
import {
  deleteBingConversation,
  deleteOpenRouterConversation,
  getConversationFor,
  getOpenRouterConversationFor,
  getWAChat,
  resetOpenRouterMemory,
} from "../../crud/conversation";
import { deleteAllReminder } from "../reminder/utils";

export async function handleReset(
  message: proto.IWebMessageInfo,
  args: string,
  sock: WASocket
): Promise<string> {
  const chatId = message.key.remoteJid!;

  const waChat = await getWAChat(chatId);
  let conversation; // Later we will use this to check if the conversation exists

  if (!waChat) {
    return `${BOT_PREFIX}No chat found`;
  }

  switch (args) {
    case "bing":
      conversation = await getConversationFor(chatId);
      if (conversation) {
        await deleteBingConversation(chatId, conversation);
        return `${BOT_PREFIX}Deleted conversation for this chat`;
      }
      return `${BOT_PREFIX}No Bing conversation found for this chat`;

    case "openrouter":
      conversation = await getOpenRouterConversationFor(chatId);
      if (conversation) {
        await deleteOpenRouterConversation(chatId);
        return `${BOT_PREFIX}Deleted conversation for this chat`;
      }
      return "No OpenRouter conversation found for this chat";

    case "all":
      // Delete all reminders
      await deleteAllReminder(chatId);

      // Delete Bing conversation
      conversation = await getConversationFor(chatId);
      if (conversation) {
        await deleteBingConversation(chatId, conversation);
      }

      // Delete OpenRouter conversation
      conversation = await getOpenRouterConversationFor(chatId);
      if (conversation) {
        await deleteOpenRouterConversation(chatId);
      }

      // Delete chat
      await deleteChat(chatId);

      return "All data for this chat has been deleted.";

    case "lc_mem":
      conversation = await getOpenRouterConversationFor(chatId);
      if (conversation) {
        await resetOpenRouterMemory(chatId);
        return `${BOT_PREFIX}Memory for this chat has been reset`;
      }
      return "No OpenRouter conversation found for this chat";

    default:
      return `${BOT_PREFIX}Invalid reset command. Use \`reset bing\` or \`reset openrouter\` to reset the conversation for this chat.`;
  }
}
