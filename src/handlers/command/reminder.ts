import { Message } from "whatsapp-web.js";
import { deleteReminder, listAllReminders } from "../reminder/utils";

export async function handleReminderCommand(message: Message, args: string) {
  let reply: Message;
  switch (args) {
    case "all":
      return (reply = await message.reply(await deleteReminder(message.from)));
      break;
    case "list":
      return (reply = await message.reply(
        await listAllReminders(message.from)
      ));
      break;
    default:
      return (reply = await message.reply(
        await listAllReminders(message.from)
      ));
      break;
  }
}
