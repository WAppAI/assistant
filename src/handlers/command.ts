import { Message } from "whatsapp-web.js";
import { config } from "../config";

const formatters = {
  bold: "*",
  md: "```"
};

function format(text: string, format: "bold" | "md") {
  return formatters[format] + text + formatters[format];
}

const availableTones = `Available options are ${format("creative", "md")}, ${format("balanced", "md")} and ${format("precise", "md")}.`;

export async function handleCommand(message: Message, command: string, args?: string) {
  switch (command.toLowerCase()) {
    case "!ping":
      await message.reply("pong!");
      break;
    case "!help":
      await message.reply(`These are the available commands:

- ${format("!help", "md")} -> returns this help message.
- ${format("!ping", "md")} -> returns ${format("pong!", "md")} if the bot is still working, should be almost instant.
- ${format("!tone args?", "md")} -> returns the current toneStyle or sets a new one if you pass it as ${format("args", "md")}`);
      break;
    case "!tone":
      if (!args)
        await message.reply(
          `Current toneStyle: ${format(config.toneStyle, "md")}.

To set a different toneStyle, pass it as a parameter to the ${format("!tone", "md")} command (eg.: ${format("!tone precise", "md")}).

${availableTones}`
        );
      else {
        const isValidToneStyle = ["creative", "balanced", "precise"].includes(args.trim().toLowerCase());

        if (isValidToneStyle) {
          config.toneStyle = args as typeof config.toneStyle;
          await message.reply(`toneStyle set to: ${format(config.toneStyle, "md")}`);
        } else {
          await message.reply(`toneStyle ${format(args, "md")} is invalid. ${availableTones}`);
        }
      }
      break;
    default:
      await message.reply(`Command ${format(command, "md")} unknown.`);
      break;
  }
}
