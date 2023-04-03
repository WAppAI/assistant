import { Message } from "whatsapp-web.js";
import { config } from "../config";
import { getAvailableTones } from "../utils";

const AVAILABLE_TONES = getAvailableTones();

export async function handleCommand(message: Message, command: string, args?: string) {
  switch (command.toLowerCase()) {
    case "!ping":
      await message.reply("pong!");
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
          "*!tone _args_?* -> returns the current tone or sets a new one if you pass it as *_args_*"
      );
      break;
    default:
      await message.reply(`Command *${command}* unknown.`);
      break;
  }
}
