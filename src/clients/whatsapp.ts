import qrcode from "qrcode-terminal";
import cli from "../clients/cli";
import { Client, GroupChat } from "whatsapp-web.js";
import { handleMessage } from "../handlers/message";
import { handleCommand } from "../handlers/command";
import { intersection } from "../utils";
import { timeStamp } from "console";
import { date } from "zod";

// filtering empty strings due to how Array.split() works
const WHITELIST =
  process.env.WHITELIST?.split(",").filter((e) => e != "") ?? [];

const blockedUsers =
  process.env.BLOCKED_USERS?.split(",").filter((e) => e != "") ?? [];

const WHITELIST_ENABLED = WHITELIST.length != 0;
const blockedUsersEnabled = blockedUsers.length != 0;

export const whatsapp = new Client({
  puppeteer: {
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
    userDataDir: "./puppeteer",
  },
});

whatsapp.on("qr", (qr) => {
  qrcode.generate(qr, { small: true }, (qrcode: string) => {
    cli.printQRCode(qrcode);
  });
});

whatsapp.on("loading_screen", (percent) => {
  if (percent == "0") {
    cli.printLoading();
  }
});

whatsapp.on("authenticated", () => {
  cli.printAuthenticated();
});

whatsapp.on("auth_failure", () => {
  cli.printAuthenticationFailure();
});

whatsapp.on("ready", () => {
  cli.printReady();
});

whatsapp.on("message", async (message) => {
  if (message.from == "status@broadcast") {
    return;
  }

  const chat = await message.getChat();
  const contact = await message.getContact();
  const sender = contact.id.user;

  const _messageType = chat.isGroup ? "Group" : "DM";
  const _sender = `${contact.pushname}[${sender}]`;
  console.log(`${_messageType} message received from ${_sender}`);

  if (WHITELIST_ENABLED) {
    const isWhitelisted = WHITELIST.includes(sender);

    if (chat.isGroup) {
      const participants = (chat as GroupChat).participants.map(
        (user) => user.id.user
      );
      const whitelistedParticipants = intersection(WHITELIST, participants);

      if (whitelistedParticipants.length == 0) {
        await message.reply(
          "There are no whitelisted participants in this group."
        );
        return;
      }
    } else {
      if (!isWhitelisted) {
        await message.reply(`${_sender} is not whitelisted.`);
        return;
      }
    }
  }

  if (blockedUsersEnabled) {
    if (chat.isGroup) {
      const participants = (chat as GroupChat).participants.map(
        (user) => user.id.user
      );
      const blockedParticipants = intersection(blockedUsers, participants);

      if (blockedParticipants.includes(sender)) {
        await message.reply(`${_sender} is blocked from using Sydney.`);
        return;
      }
    } else {
      if (blockedUsers.includes(sender)) {
        await message.reply(`${_sender} is blocked from using Sydney.`);
        return;
      }
    }
  }

  if (message.body.startsWith("!")) {
    const [command, ...args] = message.body.split(" ");
    await handleCommand(message, command, args.join(" "));
  } else {
    //const timestamp = new Date(message.timestamp * 1000);
    console.log("time:", new Date().toISOString());
    //message.body = `${timestamp}\n${message.body}`;
    console.log("message:", message.body);
    await handleMessage(message);
  }
});
