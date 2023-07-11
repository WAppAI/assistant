import scheduler from "node-schedule";
import { v4 as uuidv4 } from "uuid";
import { Client, Message } from "whatsapp-web.js";
import KeyvSqlite from "@keyv/sqlite";
import Keyv from "keyv";
import { ReminderI, RemindersI, StoredRemindersI } from "../types";
import { whatsapp } from "../clients/whatsapp";

export const reminderDB: Keyv<StoredRemindersI[] | []> = new Keyv({
  store: new KeyvSqlite({ uri: "sqlite://./reminder_db.sqlite" }),
});

export const reminders: RemindersI[] = []; //const that stores all the reminder jobs

export async function loadReminders() {
  const storedReminders = (await reminderDB.get("reminders")) || [];
  const previousReminders: StoredRemindersI[] = storedReminders;
  // Clean the reminders in the database
  await reminderDB.set("reminders", []);

  for (const { reminderJson, message } of previousReminders) {
    await scheduleReminder(reminderJson, message);
  }
  console.log("Reminders loaded!");
}

export async function scheduleReminder(reminder: ReminderI, message: Message) {
  const senderId = message.from;

  // Custom function to simulate message.reply()
  const replyMessage = async (replyText: string) => {
    const client = whatsapp; // Assuming `whatsapp` is the Client instance from the `whatsapp-web.js` library

    const chat = await client.getChatById(message.to);

    try {
      await client.sendMessage(senderId, replyText, {
        quotedMessageId: message.id._serialized,
      });
    } catch (error) {
      console.log("Error when sending reply from the reminder:", error);
    }
  };

  // Custom function to simulate message.getChat()
  const getChat = async () => {
    // Simulated logic to retrieve the chat
    const chat = {
      id: senderId,
      // Add other properties of the chat object as needed
    };
    return chat;
  };

  const cronExpression = reminder.cron;
  await replyMessage(
    "This is the cron that Sydney sent, take a look to see if it's correct:\n" +
      cronExpression
  );
  const job = scheduler.scheduleJob(cronExpression, () => console.log(""));

  let reminderCount = 0;
  job.on("run", async () => {
    await replyMessage(reminder.notifyMessage);

    if (typeof reminder.repetitions === "number") {
      reminderCount++;
      if (reminder.repetitions <= reminderCount) {
        job.cancel();
        // Remove the job from the reminders database
        const storedReminders = (await reminderDB.get("reminders")) || [];
        const updatedReminders = storedReminders.filter(
          (storedReminder: StoredRemindersI) =>
            storedReminder.message.id.id !== message.id.id
        );

        await reminderDB.set("reminders", updatedReminders);

        // Remove the completed reminder from the reminders array
        const index = reminders.findIndex(
          (reminder) => reminder.id.id === message.id.id
        );
        reminders.splice(index, 1);
      }
    }
  });

  const jobData = {
    name: reminder.answer,
    id: message.id,
    job: job,
    userId: (await getChat()).id,
  };

  const storedReminders = (await reminderDB.get("reminders")) || [];
  storedReminders.push({
    reminderJson: reminder,
    message: message,
  });
  await reminderDB.set("reminders", storedReminders);

  reminders.push(jobData);
}
