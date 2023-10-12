import dayjs from "dayjs";
import schedule, { Job } from "node-schedule";
import { Message } from "whatsapp-web.js";
import { z } from "zod";
import { whatsapp } from "../../clients/whatsapp";
import { ReminderI } from "../../types/reminder";
import { prisma } from "../../clients/prisma";
import { Reminder } from "@prisma/client";

const scheduledJobsMap = new Map<number, Job[]>(); // Map of reminder IDs to arrays of scheduled jobs

// Custom function to simulate message.reply()
export const replyMessage = async (replyText: string, senderId: string) => {
  try {
    await whatsapp.sendMessage(senderId, replyText);
  } catch (error) {
    console.error("Error when sending reply from the reminder:", error);
  }
};

export function addOffset(recurrence: Date) {
  const offset = dayjs().tz(dayjs.tz.guess()).utcOffset();
  return dayjs(recurrence).add(Math.abs(offset), "minute").toDate();
}

export const ReminderSchema = z.object({
  rrule: z.string(),
  answer: z.string(),
  text: z.string(),
});

export function parseReminderString(inputString: string) {
  return ReminderSchema.parse(JSON.parse(inputString));
}

export async function scheduleReminderJob(
  savedReminder: Reminder,
  message: Message,
  recurrences: Date[]
) {
  const { answer, text }: ReminderI = JSON.parse(savedReminder.reminder);
  const reminderId = savedReminder.id;
  const jobArray: Job[] = [];

  for (const recurrence of recurrences) {
    const job = schedule.scheduleJob(recurrence, async () => {
      const contact = message.from;
      const recurrencesLeft =
        recurrences.length - recurrences.indexOf(recurrence);
      const totalRecurrences = recurrences.length;
      const nextRecurrence = recurrences[recurrences.indexOf(recurrence) + 1];

      console.log(
        `Reminding ${contact} about ${text} (${recurrencesLeft}/${totalRecurrences})`
      );
      console.log(`Next recurrence: ${nextRecurrence}`);
      await replyMessage(answer, contact);
    });
    jobArray.push(job);
  }

  scheduledJobsMap.set(reminderId, jobArray);
}

export async function deleteReminder(waChatId: string) {
  const waChat = await prisma.wAChat.findUnique({
    where: { id: waChatId },
    include: { reminders: true },
  });

  if (!waChat) {
    console.error(`WAChat not found for user ${waChatId}`);
    return `WAChat not found for user ${waChatId}`;
  }

  const remindersToDelete = waChat.reminders;

  for (const reminder of remindersToDelete) {
    const jobs = scheduledJobsMap.get(reminder.id);

    if (jobs) {
      jobs.forEach((job) => {
        if (job) {
          job.cancel(); // Cancel each scheduled job
        }
      });
      scheduledJobsMap.delete(reminder.id); // Remove the reminder's jobs
    }

    await prisma.reminder.delete({ where: { id: reminder.id } });
  }

  return `Deleted ${remindersToDelete.length} reminders for user ${waChatId}`;
}

export async function listAllReminders(waChatId: string) {
  const waChat = await prisma.wAChat.findUnique({
    where: { id: waChatId },
    include: { reminders: true },
  });

  if (!waChat) {
    return `WAChat not found for user ${waChatId}`;
  }

  const reminders = waChat.reminders;

  if (reminders.length === 0) {
    return `No reminders found for user ${waChatId}`;
  }

  const remindersList = reminders
    .map(
      (reminder, index) =>
        `${index + 1}. Reminder: ${JSON.parse(reminder.reminder).answer}`
    )
    .join("\n");

  return `Reminders for user ${waChatId}:\n\n${remindersList}`;
}
