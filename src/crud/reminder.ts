import { proto } from "@whiskeysockets/baileys";
import { prisma } from "../clients/prisma";
import { ReminderI } from "../types/reminder";

export async function createReminder(
  reminder: ReminderI,
  message: proto.IWebMessageInfo
) {
  try {
    return await prisma.reminder.create({
      data: {
        reminder: JSON.stringify(reminder),
        message: JSON.stringify(message),
        waChatId: message.key.remoteJid!,
      },
    });
  } catch (error) {
    // Handle any potential errors here
    console.error("Error creating reminder:", error);
    throw error;
  }
}

export async function loadAllReminders() {
  try {
    return await prisma.reminder.findMany();
  } catch (error) {
    // Handle any potential errors here
    console.error("Error loading reminders:", error);
    throw error;
  }
}
