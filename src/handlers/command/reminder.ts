import { Message } from "whatsapp-web.js";
import {
  deleteAllReminder,
  deleteReminderByIndex,
  listAllReminders,
} from "../reminder/utils";

export async function handleReminderCommand(message: Message, args: string) {
  let reply: Message;

  const userCommand = args.split(" ");
  const command = userCommand[0];

  switch (command) {
    case "delete":
      const reminderIndex = parseInt(userCommand[1]);
      if (!isNaN(reminderIndex)) {
        return (reply = await message.reply(
          await deleteReminderByIndex(message.from, reminderIndex)
        ));
      } else if (userCommand[1] === "all") {
        return (reply = await message.reply(
          await deleteAllReminder(message.from)
        ));
      } else {
        return (reply = await message.reply("Invalid reminder index"));
      }
    case "list":
      return (reply = await message.reply(
        await listAllReminders(message.from)
      ));
    default:
      return (reply = await message.reply(
        "Invalid reminder command. Use `list` to list reminders or `delete <index>` to delete a specific reminder."
      ));
  }
}
