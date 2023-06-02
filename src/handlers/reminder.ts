import scheduler from "node-schedule";
import { v4 as uuidv4 } from "uuid";
import { reminderI, remindersI } from "../types";
import { Message } from "whatsapp-web.js";

export const reminders: remindersI[] = []; //const that stores all the reminder jobs

export async function scheduleReminder(reminder: reminderI, message: Message) {
  const cronExpression = reminder.cron;
  const job = scheduler.scheduleJob(cronExpression, () => console.log(""));

  let reminderCount = 0;
  job.on("run", async () => {
    console.log("Task executed");
    await message.reply(reminder.notifyMessage);

    if (typeof reminder.repetitions === "number") {
      reminderCount++;
      if (reminder.repetitions <= reminderCount) {
        job.cancel();
        console.log("Cancelled");
      }
    }
  });

  const jobId = uuidv4(); // Generate a unique ID
  const jobData = {
    name: reminder.answer,
    id: jobId,
    job: job
  };
  reminders.push(jobData); // Add the job with its ID to the array
  console.log("jobs=", reminders);
}
