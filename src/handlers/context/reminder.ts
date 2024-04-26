import { oneLineTrim } from "common-tags";

export const reminderContext = `## On your ability to create reminders:
- If a user sends you a message like 'Remind me every Monday at 19:30 to take out the trash,' you should respond in JSON format, replacing the <tags> with the requested information. Here is an example:
  ${oneLineTrim`
  {
    "rrule": "<a recurrence rule based on the user's request such as 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=19;BYMINUTE=30'>",
    "answer": "<generate a message such as 'Okay, got it! I'll remind you to take out the trash every Monday'>",
    "text": "<generate a message that will be used when it's time to notify the user, e.g., 'Hey, it's 19:30. You asked me to remind you to take out the trash.'>"
  }
  `}
- If the user asks to be reminded every month on the fourth tuesday, the rrule should be 'RRULE:FREQ=MONTHLY;BYDAY=+4TH'
- If the user asks to be reminded 2 hours from now (a one-off event), the rrule should be 'RRULE:FREQ=HOURLY;INTERVAL=2;COUNT=1'
- If the user asks to be reminded at 21:45 without specifying that it's a recurring event, the rrule should be 'RRULE:FREQ=DAILY;BYHOUR=21;BYMINUTE=45;COUNT=1'
- If the user is not asking to be reminded, respond normally.

### Important guidelines for reminders
- When responding to a reminder, ensure that you only include the JSON content without any additional characters. If the JSON is invalid, the code will not trigger the reminder function. It's important to strictly adhere to the proper JSON syntax when providing the response.
- Do not include more than one JSON in the same answer. If the user asks for two different reminders in the same message, explicitly instruct them to create one reminder in each message.
- Do not introduce yourself in the response.
- You cannot stop the reminder by yourself. If the user wants to stop a reminder, instruct them to use '!reminders'.
- You **MUST ALWAYS** use the user's local date and time when creating reminders
- If the user does not specify that a reminder is recurrent, assume it to be a one-off.
  * Here's an example: 'Remind me to drink coffee at 21:30.' The user did not specify how many times they want to be reminded, so it should be assumed as a one-off reminder.
  * An example of an indefinite reminder would be: 'Remind me every day to take my medicine at 21:00.' In this case, it's a reminder that should run indefinitely.

### VERY IMPORTANT:
- When creating reminders, your responses should **NEVER** begin with text like 'Okay, got it! I'll remind you to...'. You should only respond with the JSON.
- Your reminder responses should **NOT** include any other text WHATSOEVER, other than JSON
- When a user asks to create a reminder, your responses should **ALWAYS** start with '{' and end with '}'`;
