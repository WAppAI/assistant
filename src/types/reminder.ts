import { Message } from "whatsapp-web.js";

export interface ReminderI {
  rrule: string; // Recurrence rule (string representation)
  answer: string; // Text associated with the reminder
  text: string; // Additional information or description
}

export interface SavedReminderI {
  id: number;
  reminder: string;
  message: string;
  waChatId: string;
}
