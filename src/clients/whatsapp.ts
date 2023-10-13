import qrcode from "qrcode";
import WAWebJS from "whatsapp-web.js";
import { handleMessage } from "../handlers/message";
import { handleSelfMessage } from "../handlers/message/self";
import { BOT_PREFIX, CMD_PREFIX } from "../constants";
import { handleCommand } from "../handlers/command";
import {
  shouldIgnoreUnread,
  shouldIgnore,
  shouldReply,
} from "../helpers/message";
import { handleGroupJoin } from "../handlers/group-join";
import { loadAllReminders } from "../crud/reminder";
import { loadAllRemindersAndSchedule } from "../handlers/reminder/load-reminder";

// Doing this for now because ts-node complains about commonjs modules, will fix later
const { Client, LocalAuth } = WAWebJS;

export const whatsapp = new Client({
  authStrategy: new LocalAuth(),

  puppeteer: {
    handleSIGTERM: false,
    handleSIGINT: false,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--no-default-browser-check",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
});

whatsapp.on("qr", async (qr) => {
  const code = await qrcode.toString(qr, { type: "terminal", small: true });
  console.log(code);
});

whatsapp.on("loading_screen", (percent) => {
  console.log(`Loading WhatsApp Web... ${percent}%`);
});

whatsapp.on("authenticated", () => {
  console.log("Authenticated");
});

whatsapp.on("auth_failure", (message) => {
  console.log("Authentication failure. Message:", message);
});

whatsapp.on("ready", async () => {
  console.log("WhatsApp Web ready");
  await loadAllRemindersAndSchedule();
  console.log("Bot is ready");
});

whatsapp.on("group_join", handleGroupJoin);

// order matters here, do not mess with it
whatsapp.on("message", async (message) => {
  // returns based on ALLOWED_USERS and BLOCKED_USERS
  if (await shouldIgnore(message)) return;

  // getting chat here to avoid getting it again in shouldIgnoreUnread()
  const chat = await message.getChat();

  // returns if there too many are unread messages;
  if (await shouldIgnoreUnread(chat)) return;

  // this is needed to not trigger ignoreUnread() again
  await chat.sendSeen();

  // returns if it's a group message and the bot is not mentioned
  if (!(await shouldReply(message))) return;

  const isCommand = message.body.startsWith(CMD_PREFIX);
  if (isCommand) {
    return handleCommand(message);
  } else {
    return handleMessage(message);
  }
});

// TODO: may be possible to use only 'message_create' instead of 'message' and still handle self
whatsapp.on("message_create", async (message) => {
  const isSelf = message.to === message.from;
  const isBotMessage = message.body.startsWith(BOT_PREFIX);
  if (!isSelf || isBotMessage) return;
  if (await shouldIgnore(message)) return;

  const isCommand = message.body.startsWith("!");
  if (isCommand) {
    return handleCommand(message);
  } else {
    return handleSelfMessage(message);
  }
});
