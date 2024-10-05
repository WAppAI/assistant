import { Message } from "whatsapp-web.js";
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

export async function handleReset(message: Message, args: string) {
  let reply: Message;

  const chat = await message.getChat();
  const waChat = await getWAChat(chat.id._serialized);
  let conversation; //Later we will use this to check if the conversation exists

  if (!waChat) return message.reply(`${BOT_PREFIX}No chat found`);

  switch (args) {
    case "bing":
      conversation = await getConversationFor(chat.id._serialized);
      if (conversation) {
        await deleteBingConversation(chat.id._serialized, conversation);
        reply = await message.reply(
          `${BOT_PREFIX}Deleted conversation for this chat`
        );

        return reply;
      }
      return message.reply(
        `${BOT_PREFIX}No Bing conversation found for this chat`
      );
      break;

    case "openrouter":
      conversation = await getOpenRouterConversationFor(chat.id._serialized);
      if (conversation) {
        await deleteOpenRouterConversation(chat.id._serialized);
        reply = await message.reply(
          `${BOT_PREFIX}Deleted conversation for this chat`
        );
        return reply;
      }
      reply = await message.reply(
        "No OpenRouter conversation found for this chat"
      );
      return reply;
      break;

    case "all":
      // Delete all reminders
      await deleteAllReminder(message.from);

      // Delete Bing conversation
      conversation = await getConversationFor(chat.id._serialized);
      if (conversation) {
        await deleteBingConversation(chat.id._serialized, conversation);
      }

      // Delete OpenRouter conversation
      conversation = await getOpenRouterConversationFor(chat.id._serialized);
      if (conversation) {
        await deleteOpenRouterConversation(chat.id._serialized);
      }

      // Delete chat
      await deleteChat(chat.id._serialized);

      reply = await message.reply("All data for this chat has been deleted.");
      return reply;
      break;

    case "lc_mem":
      conversation = await getOpenRouterConversationFor(chat.id._serialized);
      if (conversation) {
        await resetOpenRouterMemory(chat.id._serialized);
        reply = await message.reply(
          `${BOT_PREFIX}Memory for this chat has been reset`
        );
        return reply;
      }
      reply = await message.reply(
        "No OpenRouter conversation found for this chat"
      );
      return reply;
      break;

    default:
      reply = await message.reply(
        `${BOT_PREFIX}Invalid reset command. Use \`reset bing\` or \`reset openrouter\` to reset the conversation for this chat.`
      );
      return reply;
  }
}
