import { Chat, Message } from "whatsapp-web.js";
import { promiseTracker } from "../clients/prompt";
import { sydney } from "../clients/sydney";
import { config } from "../config";
import { getAvailableTones } from "../utils";

const AVAILABLE_TONES = getAvailableTones();

async function getPendingPromptsForChat(chat: Chat) {
  const pendingPrompts = promiseTracker.listPendingPrompts();

  return pendingPrompts.filter(({ data }) => data.chat.id._serialized === chat.id._serialized);
}

export async function handleCommand(message: Message, command: string, args?: string) {
  const chat = await message.getChat();

  switch (command.toLowerCase()) {
    case "!ping":
      await message.reply("pong!");
      break;
    case "!reset":
      await sydney.conversationsCache.delete(chat.id._serialized);
      await message.reply("Conversation history reset.");
      break;
    case "!pending":
      const pendingPromptsForChat = await getPendingPromptsForChat(chat);

      if (pendingPromptsForChat.length === 0) {
        await message.reply("There are no pending prompts.");
        break;
      }

      const pendingTexts = pendingPromptsForChat.map(({ data }) => `- ${data.text}`).join("\n");

      await message.reply(`These are the pending prompts:\n\n${pendingTexts}`);
      break;
    case "!tone":
      if (!args)
        await message.reply(
          `Current tone: *${config.toneStyle}*.\n\n` +
            "To set a different tone, pass it as a parameter to the *!tone* command (eg.: *!tone precise*).\n\n" +
            AVAILABLE_TONES
        );
      else {
        const tone = args.trim().toLowerCase();
        const isValidTone = config.VALID_TONES.includes(tone as typeof config.VALID_TONES[number]);

        if (isValidTone) {
          config.toneStyle = tone as typeof config.toneStyle;
          await message.reply(`Tone set to: *${config.toneStyle}*`);
        } else {
          await message.reply(`Tone *${tone}* is invalid.` + AVAILABLE_TONES);
        }
      }
      break;
    case "!help":
      await message.reply(
        "These are the available commands:\n\n" +
          "*!help* -> returns this help message.\n" +
          "*!ping* -> returns *pong!* if the bot is still working; this should be almost instant.\n" +
          "*!tone _args_?* -> returns the current tone or sets a new one if you pass it as *_args_*\n" +
          "*!pending* -> returns a list of all current pending prompts for this chat"
      );
      break;
    default:
      await message.reply(`Command *${command}* unknown.`);
      break;
  }
}
