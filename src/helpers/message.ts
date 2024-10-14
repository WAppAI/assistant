import { proto } from "@whiskeysockets/baileys";
import { sock } from "../clients/whatsapp";
import {
  ALLOWED_USERS,
  BLOCKED_USERS,
  BOT_PREFIX,
  CMD_PREFIX,
  IGNORE_MESSAGES_WARNING,
} from "../constants";

export function isGroupMessage(message: proto.IWebMessageInfo) {
  return message.key.remoteJid?.endsWith("@g.us") ?? false;
}

export function getPhoneNumber(message: proto.IWebMessageInfo) {
  return message.key.remoteJid?.split("@")[0] ?? "";
}

async function getGroupName(groupJid: string): Promise<string> {
  try {
    const groupMetadata = await sock.groupMetadata(groupJid);
    return groupMetadata.subject || groupJid;
  } catch (error) {
    console.error(`Error fetching group name for ${groupJid}:`, error);
    return groupJid;
  }
}

export async function shouldIgnore(message: proto.IWebMessageInfo) {
  if (ALLOWED_USERS.length === 0 && BLOCKED_USERS.length === 0) {
    return false;
  }

  const senderNumber = getPhoneNumber(message);

  if (isGroupMessage(message)) {
    // Check if this message came from a blocked user
    if (BLOCKED_USERS.includes(senderNumber)) {
      console.warn(
        `Ignoring message from blocked user "${message.pushName}" <${senderNumber}>`
      );
      return true;
    }

    // Fetch group metadata
    const groupJid = message.key.remoteJid!;
    try {
      const groupMetadata = await sock.groupMetadata(groupJid);

      // Check if any allowed users are in the group
      const allowedInGroup = groupMetadata.participants.some((participant) => {
        const participantNumber = participant.id.split("@")[0];
        return ALLOWED_USERS.includes(participantNumber);
      });

      if (!allowedInGroup) {
        console.warn(
          `Ignoring message from group "${groupMetadata.subject}" because no allowed users are in it`
        );
        return true;
      }
    } catch (error) {
      console.error("Error fetching group metadata:", error);
      return true; // Ignore the message if we can't fetch group data
    }
  } else {
    // It's a private message, so just check if the user is blocked or isn't in the allowed list
    if (
      BLOCKED_USERS.includes(senderNumber) ||
      !ALLOWED_USERS.includes(senderNumber)
    ) {
      console.warn(
        `Ignoring message from blocked/not allowed user "${message.pushName}" <${senderNumber}>`
      );
      return true;
    }
  }

  return false;
}

export async function shouldReply(message: proto.IWebMessageInfo) {
  // Extract the message body from either conversation or extendedTextMessage
  const messageBody =
    message.message?.conversation || message.message?.extendedTextMessage?.text;

  // Check if the message is a command
  const isCommand = (messageBody ?? "").startsWith(CMD_PREFIX);

  if (isGroupMessage(message) && !isCommand) {
    // Get mentions and check if the bot is mentioned
    const mentions =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    // Extract the core user ID without suffix for comparison
    const userId = sock.user?.id?.split("@")[0].split(":")[0] || "";
    const isMentioned = mentions.some(
      (mention) => mention.split("@")[0] === userId || mention === sock.user?.id
    );

    // Check if the message is quoting the bot's message
    const quotedParticipant =
      message.message?.extendedTextMessage?.contextInfo?.participant;
    const isQuotingBot =
      quotedParticipant?.split("@")[0].split(":")[0] === userId;

    if (!isMentioned && !isQuotingBot) {
      // Ignore if not mentioned or not quoting the bot
      console.warn(
        "Group message received, but the bot was not mentioned and its last completion was not quoted. Ignoring."
      );
      return false;
    }
  }

  return true;
}

export async function shouldIgnoreUnread(
  message: proto.IWebMessageInfo,
  unreadCount: number
) {
  if (unreadCount > 1) {
    const chatJid = message.key.remoteJid!;

    // Mark messages as read
    await sock.readMessages([message.key]);

    const isGroup = chatJid.endsWith("@g.us");
    let warningMessage = "";

    if (isGroup) {
      const groupName = await getGroupName(chatJid);
      console.warn(
        `Too many unread messages (${unreadCount}) for group chat "${groupName}". Ignoring...`
      );
      warningMessage = `Too many unread messages (${unreadCount}) since I've last seen this chat. I'm ignoring them. If you need me to respond, please @mention me or quote my last completion in this chat.`;
    } else {
      console.warn(
        `Too many unread messages (${unreadCount}) for chat with user "${getPhoneNumber(message)}". Ignoring...`
      );
      warningMessage = `Too many unread messages (${unreadCount}) since I've last seen this chat. I'm ignoring them. If you need me to respond, please message me again.`;
    }

    if (IGNORE_MESSAGES_WARNING === "true") {
      await sock.sendMessage(chatJid, { text: BOT_PREFIX + warningMessage });
    }

    return true;
  }

  return false;
}
