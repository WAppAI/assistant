import { proto } from "@whiskeysockets/baileys";
import {
  deleteAllReminder,
  deleteReminderByIndex,
  listAllReminders,
} from "../reminder/utils";

export async function handleReminderCommand(
  message: proto.IWebMessageInfo,
  args: string
): Promise<string> {
  const userCommand = args.split(" ");
  const command = userCommand[0];
  const chatId = message.key.remoteJid!;

  switch (command) {
    case "delete":
      const reminderIndex = parseInt(userCommand[1]);
      if (!isNaN(reminderIndex)) {
        return await deleteReminderByIndex(chatId, reminderIndex);
      } else if (userCommand[1] === "all") {
        return await deleteAllReminder(chatId);
      } else {
        return "Invalid reminder index";
      }
    case "list":
      return await listAllReminders(chatId);
    default:
      return "Invalid reminder command. Use `list` to list reminders or `delete <index>` to delete a specific reminder.";
  }
}
