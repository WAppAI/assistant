import { oneLine, stripIndents } from "common-tags";
import { Message } from "whatsapp-web.js";
import { ASSISTANT_NAME, BOT_PREFIX, CMD_PREFIX } from "../../constants";
import { invalidArgumentMessage } from "../../helpers/command";

export async function handleHelp(message: Message, args: string) {
  let reply: Message;

  switch (args) {
    case "help":
      reply = await message.reply(helpHelpMessage);
      break;
    case "ping":
      reply = await message.reply(pingHelpMessage);
      break;
    case "reset":
      reply = await message.reply(resetHelpMessage);
      break;
    case "jailbreak":
      reply = await message.reply(jailbreakHelpMessage);
      break;
    case "":
      reply = await message.reply(helpMessage);
      break;
    default:
      reply = await message.reply(invalidArgumentMessage(args, "help <command>"));
      break;
  }

  return reply;
}

const helpMessage = stripIndents`${BOT_PREFIX}Available commands:

🆘 *${CMD_PREFIX}help _<command>_*
Displays the available commands, their functionalities and how to use them.
- Run *${CMD_PREFIX}help _<command>_* for more information about a specific command.

🏓 *${CMD_PREFIX}ping*
Checks if the bot is alive by responding with '*_pong!_*'.

🗑️ *${CMD_PREFIX}reset*
Clears the conversation history for _this_ chat.
- Run *${CMD_PREFIX}help reset* for more information.

🔓 *${CMD_PREFIX}jailbreak _<enable|disable|on|off>_*
Enables or disables *_${ASSISTANT_NAME}_*'s jailbreak mode.
- Run *${CMD_PREFIX}help jailbreak* for more information.`;

const helpHelpMessage = stripIndents`I see what you did there.

That's pretty meta, but I'm not gonna help you with that.

Smart ass.
`;

const pingHelpMessage = stripIndents`🏓 *${CMD_PREFIX}ping*
Checks if the bot is alive by responding with '*_pong!_*'.`;

const resetHelpMessage = stripIndents`🗑️ *${CMD_PREFIX}reset*
Clears the conversation history for _this_ chat.

- If no argument is given, it clears the conversation history for _this_ chat.

- *NOTE*: In group chats, only *admins* can use this command.

- *NOTE*: This action is *irreversible!*`;

const jailbreakHelpMessage = stripIndents`🔓 *${CMD_PREFIX}jailbreak _<enable|disable|on|off>_*
Toggles *_${ASSISTANT_NAME}_*'s jailbreak mode on or off.

- If the argument *_<on>_* or *_<enable>_* is provided, it *enables* jailbreak mode for _this_ chat.

- If the argument *_<off>_* or *_<disable>_* is provided, it *disables* jailbreak mode for _this_ chat.

- If no argument is given, it returns the current jailbreak status.

- *NOTE*: enabling or disabling jailbreak mid-conversation will also reset it.

- *NOTE*: In group chats, only *admins* can use this command.

- *NOTE*: This action is *irreversible!*`;
