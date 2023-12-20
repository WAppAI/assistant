import { GroupChat, Message } from "whatsapp-web.js";
import { stripIndents } from "common-tags";
import { whatsapp } from "../../clients/whatsapp";

export async function getChatContext(message: Message) {
  let chat = await message.getChat();
  let chatContext = "";
  let publicUserName: string;

  if (chat.isGroup) {
    const groupChat = chat as GroupChat;
    const contact = await whatsapp.getContactById(message.author as string);
    publicUserName = contact.pushname;
    const groupContacts = await Promise.all(
      groupChat.participants.map((participant) =>
        whatsapp.getContactById(participant.id._serialized)
      )
    );
    const groupContactNames = groupContacts
      .map((contact) => contact.pushname)
      .join(", ");

    chatContext = stripIndents`- You are in a group chat
    - There are ${groupChat.participants.length} participants in the group
    - The group's name is '${groupChat.name}'
    - The group's participants are: ${groupContactNames}
    - '${publicUserName}' is who sent this message
  `;
  } else {
    publicUserName = (await message.getContact()).pushname;
    chatContext = stripIndents`- You are in a private chat
    - The user's name is '${publicUserName}'
    `;
  }

  return chatContext;
}
