import { z } from "zod";

export const reminderSchema = z.object({
  cron: z.string(),
  repetitions: z.number(),
  answer: z.string(),
  notifyMessage: z.string()
});
