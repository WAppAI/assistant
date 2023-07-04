import { oneLine, stripIndent } from "common-tags";
import { Message } from "whatsapp-web.js";

export async function getContext(message: Message) {
  let context = stripIndent`[system](#additional_instructions)
  
  # Important guidelines for your role as an assistant:
  - You should not present yourself in every message.`;

  const contact = await message.getContact();
  const chat = await message.getChat();

  if (chat.isGroup)
    context += `- You are in a WhatsApp group chat. You don't know the group chat's name. This message was sent by: ${contact.pushname}.\nWhen referring to users, do not use '@' mentions.`;
  else
    context += `- You are in a WhatsApp private chat. The user's name is ${contact.pushname}.`;

  return context + process.env.USER_CONTEXT;
}
