// @ts-ignore
import { proto } from "@whiskeysockets/baileys";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import rrule from "rrule";
import { REPLY_RRULES } from "../../constants";
import { createReminder } from "../../crud/reminder";
import { addOffset, parseReminderString, scheduleReminderJob } from "./utils";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function handleReminderFor(
  message: proto.IWebMessageInfo,
  llmAnswer: string
) {
  const isReminder = llmAnswer.startsWith("{") && llmAnswer.endsWith("}");
  if (!isReminder) return llmAnswer;

  const reminder = parseReminderString(llmAnswer);
  const recurrenceRule = rrule.rrulestr(reminder.rrule, {
    // this makes sure that the first recurrence can happen today
    dtstart: dayjs().subtract(1, "day").toDate(),
  });

  // gets all recurrences within 1 year from now
  const recurrences = recurrenceRule
    .all((date) => {
      return date < dayjs().add(1, "year").toDate();
    })
    .map((recurrence) => {
      if (!reminder.rrule.includes("BYSECOND")) {
        // this makes sure that the reminder will trigger at the start of the minute,
        // and not at some random second when the reminder was given by the AI
        // if however the user specifies that should be reminded at a specific second,
        // then we don't want to override that
        recurrence.setSeconds(0);
      }

      // adds the timezone offset to each recurrence;
      // this is needed because the recurrence rule is in UTC, but we want to schedule it in the user's timezone
      // rrule built-in support for tzid is not working for some reason, doing it manually
      return addOffset(recurrence, reminder.rrule);
    });

  console.log(
    `Scheduling ${recurrences.length} recurrences for "${message.message?.extendedTextMessage?.text}"`
  );
  console.log(`Next recurrence: ${recurrences[0]}`);

  const savedReminder = await createReminder(reminder, message); //saves reminder

  await scheduleReminderJob(savedReminder, message, recurrences);

  if (REPLY_RRULES === "true")
    return `${reminder.answer}\n\n${reminder.rrule}\nNext recurrence: ${recurrences[0]}`;
  return reminder.answer;
}
