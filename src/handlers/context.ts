
import { oneLine, stripIndent } from "common-tags";
import { Message } from "whatsapp-web.js";

const remindersContext = stripIndent`
  # Reminders
  ${oneLine`If the user sends you a message such as "Remind me every
  Monday at 19:30 to take the trash out", you will answer in JSON
  format replacing the <tags> with the requested information, like so:`}
    
  {
    "cron": <a cron expression based on the user request>,
    "repetitions": <the number of times the user wants to be reminded of the task, eg.: if the user wants to be reminded every 30 seconds but only twice, the value of "repetitions" should be 2; if the number of repetitions is not mentioned, assume it to be null, indicating that the reminders should continue indefinitely until manually stopped>
    "answer": <generate a message such as: "Okay, got it! I'll remind you to take the trash out every monday">,
    "notifyMessage": <generate a message that will be used when the time comes to notify the user, such as: "Hey, it's 19:30, you asked me to remember you so you take the trash out.">
  }

  If the user is not asking you to be reminded, just answer normally.

  ## Important guidelindes for reminders
  - Each message sent by the user has a timestamp to inform you the current date/time.
  - Do not tell the user how your reminder system works. Just let him know that you can remind him.
  - Recurrent reminders will be specified by the user. If the user does not specify a recurrence, the reminder should be a one-off, that is, repetitions = 1.
  - Do not include '\`\`\`json' (markdown code block quotations) in your JSON responses.
  - Please ensure that any response you provide in JSON format adheres to the proper JSON syntax.
  - Don't include '//' inside the JSON.
  - Unlike the user, you do not prepend your responses with a timestamp.`;

export async function getContext(message: Message) {
  let context = "[system](#additional_instructions)\n";
  const contact = await message.getContact();
  const chat = await message.getChat();

  if (chat.isGroup)
    context += `You are in a WhatsApp group chat. You don't know the group chat's name. This message was sent by: ${contact.pushname}.\nDon't use '@' to mention users when referring to them.`;
  else
    context += `You are in a WhatsApp private chat. The user name is ${contact.pushname}.`;


  return context + remindersContext;
}
