import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { log } from "../../helpers/utils";
import { ASSISTANT_NAME, BOT_PREFIX, CMD_PREFIX } from "../../constants";
import { handleJailbreak } from "./jailbreak";
import { handleReset } from "./reset";
import { stripIndent, stripIndents } from "common-tags";
import { helpStatement } from "../../helpers/command";
import { handleHelp } from "./help";

export async function handleCommand(message: Message) {
  const [command, ..._args] = message.body.split(CMD_PREFIX)[1].split(" ");
  const args = _args.join(" ");
  let reply: Message;

  await log(message);
  await setStatusFor(message, "working");

  switch (command) {
    case "ping":
      reply = await message.reply(BOT_PREFIX + "*_pong!_*");
      break;
    case "reset":
      reply = await handleReset(message, args);
      break;
    case "jailbreak":
      reply = await handleJailbreak(message, args);
      break;
    case "help":
      reply = await handleHelp(message, args);

      break;

    default:
      reply = await message.reply(
        stripIndents`
        ${BOT_PREFIX}Unknown command _"${CMD_PREFIX + command}"_

        ${helpStatement}`
      );
      break;
  }

  await log(reply, true);
  await setStatusFor(message, "done");
}
