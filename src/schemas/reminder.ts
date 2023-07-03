import { z } from "zod";

export const reminderSchema = z.object({
  cron: z.string(),
  repetitions: z.union([z.number(), z.null()]),
  answer: z.string(),
  notifyMessage: z.string(),
});
