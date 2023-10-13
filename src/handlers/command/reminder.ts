import { Message } from "whatsapp-web.js";
import {
  deleteReminder,
  deleteReminderByIndex,
  listAllReminders,
} from "../reminder/utils";

export async function handleReminderCommand(message: Message, args: string) {
  let reply: Message;

  // Try to parse args into an integer
  const parsedArgs = parseInt(args);

  const userCommand = args.split(" ");
  const command = userCommand[0];

  switch (command) {
    case "all":
      return (reply = await message.reply(await deleteReminder(message.from)));
    case "list":
      return (reply = await message.reply(
        await listAllReminders(message.from)
      ));
    case "delete":
      const reminderIndex = parseInt(userCommand[1]);
      if (!isNaN(reminderIndex)) {
        return (reply = await message.reply(
          await deleteReminderByIndex(message.from, reminderIndex)
        ));
      } else {
        return (reply = await message.reply("Invalid reminder index"));
      }
    default:
      return (reply = await message.reply(
        await listAllReminders(message.from)
      ));
  }
}
