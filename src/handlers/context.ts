import { Message } from "whatsapp-web.js";

export async function getContext(message: Message) {
  let context = "[system](#additional_instructions)\n";
  const contact = await message.getContact();
  const chat = await message.getChat();

  if (chat.isGroup)
    context += `You are in a WhatsApp group chat. You don't know the group chat's name. This message was sent by: ${contact.pushname}.\nDon't use '@' to mention users when referring to them.`;
  else
    context += `You are in a WhatsApp private chat. The user name is ${contact.pushname}.`;

  return context;
}
