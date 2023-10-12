import dayjs from "dayjs";
import schedule from "node-schedule";
import { Message } from "whatsapp-web.js";
import { z } from "zod";
import { whatsapp } from "../../clients/whatsapp";
import { ReminderI } from "../../types/reminder";
import { prisma } from "../../clients/prisma";
import { Reminder } from "@prisma/client";

// Custom function to simulate message.reply()
export const replyMessage = async (replyText: string, senderId: string) => {
  try {
    await whatsapp.sendMessage(senderId, replyText);
  } catch (error) {
    console.log("Error when sending reply from the reminder:", error);
  }
};

export function addOffset(recurrence: Date) {
  const offset = dayjs().tz(dayjs.tz.guess()).utcOffset();
  return (recurrence = dayjs(recurrence)
    .add(Math.abs(offset), "minute")
    .toDate());
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
  reminder: ReminderI,
  message: Message,
  recurrences: Date[]
) {
  console.log(
    `Scheduling ${recurrences.length} recurrences for "${message.body}`
  );
  for (const recurrence of recurrences) {
    const job = schedule.scheduleJob(recurrence, async () => {
      console.log(`Scheduling recurrence for ${recurrence}`);
      const contact = message.from;
      const recurrencesLeft =
        recurrences.length - recurrences.indexOf(recurrence);
      const totalRecurrences = recurrences.length;
      const nextRecurrence = recurrences[recurrences.indexOf(recurrence) + 1];

      console.log(
        `Reminding ${contact} about ${reminder.text} (${recurrencesLeft}/${totalRecurrences})`
      );
      console.log(`Next recurrence: ${nextRecurrence}`);
      await replyMessage(reminder.text, contact);
    });
  }
}

export async function deleteReminder(waChatId: string) {
  const waChat = await prisma.wAChat.findUnique({
    where: { id: waChatId },
    include: { reminders: true }, // Include associated reminders
  });

  if (!waChat) {
    console.error(`WAChat not found for user ${waChatId}`);
    return `WAChat not found for user ${waChatId}`;
  }

  const remindersToDelete = waChat.reminders;

  for (const reminder of remindersToDelete) {
    await prisma.reminder.delete({ where: { id: reminder.id } });
  }

  console.log(
    `Deleted ${remindersToDelete.length} reminders for user ${waChatId}`
  );
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

/*function appendTZID(rruleString: string) {
  if (rruleString.includes("TZID")) return rruleString;

  const tz = dayjs.tz.guess();
  const timezoneOffsetMinutes = dayjs().tz(tz).utcOffset();
  const sign = timezoneOffsetMinutes < 0 ? "-" : "+";

  const offsetHours = Math.abs(Math.floor(timezoneOffsetMinutes / 60));
  const offsetHoursString = offsetHours.toString().padStart(2, "0");

  const tzid = `GMT${sign}${offsetHoursString}`;

  return `${rruleString};TZID=${tzid}`;
}*/
