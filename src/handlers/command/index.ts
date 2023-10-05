import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { log } from "../../helpers/utils";
import { BOT_PREFIX, CMD_PREFIX } from "../../constants";
import { handleJailbreak } from "./jailbreak";
import { handleReset } from "./reset";

export async function handleCommand(message: Message) {
  const [command, ..._args] = message.body.split(CMD_PREFIX)[1].split(" ");
  const args = _args.join(" ");
  let reply: Message;

  await log(message);
  await setStatusFor(message, "working");

  switch (command) {
    case "ping":
      reply = await message.reply(BOT_PREFIX + "pong!");
      break;
    case "reset":
      reply = await handleReset(message, args);
      break;
    case "jailbreak":
      reply = await handleJailbreak(message, args);
      break;
    case "help":
      reply = await message.reply(
        `${BOT_PREFIX}Available commands:\n\n` +
          `🆘 *${CMD_PREFIX}help* - Shows you this awesome help message.\n\n` +
          `🏓 *${CMD_PREFIX}ping* - Checks if I'm alive by responding with a *pong!* Should be super fast.\n\n` +
          `🗑️ *${CMD_PREFIX}reset* - Clears our conversation history. In group chats, only *admins* can use this command.\n\n` +
          `🔓 *${CMD_PREFIX}jailbreak* - Toggles *Sydney* jailbreak mode on or off using *${CMD_PREFIX}jailbreak on* or *${CMD_PREFIX}jailbreak off*.\n`
      );
      break;

    default:
      reply = await message.reply(BOT_PREFIX + "unknown command");
      break;
  }

  await log(reply, true);
  await setStatusFor(message, "done");
}
