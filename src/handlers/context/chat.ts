import { WAProto } from "@whiskeysockets/baileys";
import { stripIndents } from "common-tags";
import { sock } from "../../clients/whatsapp";

export async function getChatContext(message: WAProto.IWebMessageInfo) {
  let chatContext = "";
  let publicUserName = "";

  const chatId = message.key.remoteJid;
  if (!chatId) {
    return "";
  }
  const isGroup = chatId.endsWith("@g.us");

  if (isGroup) {
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderId = message.key.participant || message.key.remoteJid;
    publicUserName = message.pushName || "Unknown";

    const groupContactNames = groupMetadata.participants
      .map((participant) => participant.id.split("@")[0])
      .join(", ");

    chatContext = stripIndents`- You are in a group chat
    - There are ${groupMetadata.participants.length} participants in the group
    - The group's name is '${groupMetadata.subject}'
    - The group's participants are: ${groupContactNames}
    - '${publicUserName}' is who sent this message
    `;
  } else {
    publicUserName = message.pushName || "Unknown";

    chatContext = stripIndents`- You are in a private chat
    - The user's name is '${publicUserName}'
    `;
  }

  return chatContext;
}
