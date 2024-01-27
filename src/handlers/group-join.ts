import { GroupChat, GroupNotification } from "whatsapp-web.js";
import { whatsapp } from "../clients/whatsapp";
import { ALLOWED_USERS, BLOCKED_USERS } from "../constants";

export async function handleGroupJoin(notification: GroupNotification) {
  const adder = await whatsapp.getContactById(notification.author);

  if (!ALLOWED_USERS.includes(adder.number) || BLOCKED_USERS.includes(adder.number)) {
    const groupChat = (await notification.getChat()) as GroupChat;
    console.warn(
      `User "${adder.pushname}" <${adder.number}> tried to add the bot to group "${groupChat.name}", but is not allowed. Leaving.`
    );

    await groupChat
      .sendMessage(`Sorry, @${adder.id.user}, you're not allowed to add me to groups. Bye!`, {
        mentions: [adder.toString()],
      })
      .then(async () => {
        await groupChat.leave();
      });
  }
}
