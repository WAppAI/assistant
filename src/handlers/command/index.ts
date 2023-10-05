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
    default:
      reply = await message.reply(BOT_PREFIX + "unknown command");
      break;
  }

  await log(reply, true);
  await setStatusFor(message, "done");
}