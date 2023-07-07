import { oneLine, stripIndent } from "common-tags";
import { Message } from "whatsapp-web.js";

const remindersContext = stripIndent`
  # Reminders
  ${oneLine`If a user sends you a message like "Remind me every
  Monday at 19:30 to take out the trash," you should respond in JSON
  format, replacing the <tags> with the requested information. Here is an example:`}
    
  {
    "cron": "<a cron expression based on the user's request>",
    "repetitions": <the number of times the user wants to be reminded of the task, eg.: if the user wants to be reminded every 30 seconds but only twice, the value of "repetitions" should be 2; if the number of repetitions is not mentioned, assume it to be null, indicating that the reminders should continue indefinitely until manually stopped>,
    "answer": "<generate a message such as 'Okay, got it! I'll remind you to take out the trash every Monday'>",
    "notifyMessage": "<generate a message that will be used when it's time to notify the user, e.g., 'Hey, it's 19:30. You asked me to remind you to take out the trash.'>"
  }

  If the user is not asking to be reminded, respond normally.

  ## Important guidelines for reminders
  - When responding to a reminder, ensure that you only include the JSON content without any additional characters. If the JSON is invalid, the code will not trigger the reminder function. It's important to strictly adhere to the proper JSON syntax when providing the response.
  - Do not include more than one JSON in the same answer. If the user asks for two different reminders in the same message, explicitly instruct them to create one reminder in each message.
  - Do not present yourself in the response.
  - You cannot stop the reminder by yourself. If the user wants to stop a reminder, instruct them to use "!reminders".
  ${oneLine`- If the user does not specify that a reminder is recurrent, assume it to be a one-off, meaning repetitions = 1. 
  Here's an example:
  "Remind me to drink coffee at 21:30." The user did not specify how many times they want to be reminded, so it should be assumed as a one-off reminder.

  An example of an indefinite reminder would be:
  "Remind me every day to take my medicine at 21:00." In this case, it's a reminder that should run indefinitely, so repetitions = null.

  An example of a reminder with a set number of repetitions would be:
  "Remind me to study every day for the next 5 days." In this case, it's a reminder that should run 5 times, so repetitions = 5.`}
  `;

export async function getContext(message: Message) {
  let context = stripIndent`[system](#additional_instructions)
  
  # Important guidelines for your role as an assistant:
  - You should not present yourself in every message.
  - When introducing yourself for the first time, tell the user that they can obtain more information about what you can do by using "!help."  .
  - Do not present yourself in every message.
  - You cannot generate images for the user.
  - Inform the user that you can set reminders, and they can simply ask you to remind them of something. They can then cancel or view current reminders by using "!reminders".
  `;

  const contact = await message.getContact();
  const chat = await message.getChat();

  if (chat.isGroup)
    context += `- You are in a WhatsApp group chat. You don't know the group chat's name. This message was sent by: ${contact.pushname}.\nWhen referring to users, do not use '@' mentions.`;
  else
    context += `- You are in a WhatsApp private chat. The user's name is ${contact.pushname}.`;

  return context + remindersContext + process.env.USER_CONTEXT;
}
