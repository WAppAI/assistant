import rrule from "rrule";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with the timezone plugin
dayjs.extend(utc);
dayjs.extend(timezone);

const RRULE = "RRULE:FREQ=DAILY;BYHOUR=22;BYMINUTE=30";

const recurrenceRule = rrule.rrulestr(RRULE, {
  dtstart: dayjs().subtract(1, "day").toDate(),
});

const recurrences = recurrenceRule.all((date) => date < dayjs().add(1, "year").toDate());

recurrences.forEach((recurrence) => {
  // console.log("Without offset:", recurrence.toString());

  const withOffset = addOffset(recurrence).toString();

  console.log("With offset:", withOffset);
});
console.log(recurrences.length);

function addOffset(recurrence: Date) {
  const offset = dayjs().tz(dayjs.tz.guess()).utcOffset();
  return (recurrence = dayjs(recurrence).add(Math.abs(offset), "minute").toDate());
}
