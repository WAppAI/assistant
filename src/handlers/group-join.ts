import { GroupMetadata, WASocket, proto } from "@whiskeysockets/baileys";
import { ALLOWED_USERS, BLOCKED_USERS } from "../constants";
import { sock } from "../clients/whatsapp";

export async function handleGroupJoin(message: proto.IWebMessageInfo) {
  const adderId = message.key.participant || message.key.remoteJid;
  if (typeof adderId !== "string") throw new Error("Invalid adder ID");
  const adder = await sock.onWhatsApp(adderId);

  if (
    (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(adder[0].jid)) ||
    BLOCKED_USERS.includes(adder[0].jid)
  ) {
    const groupMetadata = (await sock.groupMetadata(
      message.key.remoteJid as string
    )) as GroupMetadata;
    console.warn(
      `User <${adder[0].jid}> tried to add the bot to group "${groupMetadata.subject}", but is not allowed. Leaving.`
    );

    await sock.sendMessage(groupMetadata.id, {
      text: `Sorry, @${adder[0].jid.split("@")[0]}, you're not allowed to add me to groups. Bye!`,
      mentions: [adder[0].jid],
    });

    await sock.groupLeave(groupMetadata.id);
  }
}
