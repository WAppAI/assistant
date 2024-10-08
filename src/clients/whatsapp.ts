import qrcode from "qrcode";
// @ts-ignore
import WAWebJS, { Message } from "whatsapp-web.js";
import { CMD_PREFIX } from "../constants";
import { handleCommand } from "../handlers/command";
import { handleGroupJoin } from "../handlers/group-join";
import { handleMessage } from "../handlers/message";
import {
  setStatusFor,
  shouldIgnore,
  shouldIgnoreUnread,
  shouldReply,
} from "../helpers/message";

// Doing this for now because ts-node complains about commonjs modules, will fix later (later = never)
const { Client, LocalAuth } = WAWebJS;

export const whatsapp = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    handleSIGTERM: false,
    handleSIGINT: false,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // /snap/bin/chromium  for the gif tool to work (with chromium installed in ubuntu)
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

// @ts-ignore
whatsapp.on("qr", async (qr) => {
  const code = await qrcode.toString(qr, { type: "terminal", small: true });
  console.log(code);
});

// @ts-ignore
whatsapp.on("loading_screen", (percent) => {
  console.log(`Loading WhatsApp Web... ${percent}%`);
});

whatsapp.on("authenticated", () => {
  console.log("Authenticated");
});

// @ts-ignore
whatsapp.on("auth_failure", (message) => {
  console.log("Authentication failure. Message:", message);
});

whatsapp.on("ready", async () => {
  console.log("WhatsApp Web ready");
  console.log("Bot is ready");
});

whatsapp.on("group_join", handleGroupJoin);

const messageQueue: { [key: string]: Message[] } = {};
let isProcessingMessage = false;

// order matters here, do not mess with it
whatsapp.on("message", async (message: Message) => {
  const chat = await message.getChat();
  const chatId = chat.id._serialized;

  await chat.sendSeen();

  // returns based on ALLOWED_USERS and BLOCKED_USERS
  if (await shouldIgnore(message)) return;

  // returns if it's a group message and the bot is not mentioned
  if (!(await shouldReply(message))) return;

  // returns if there too many are unread messages;
  if (await shouldIgnoreUnread(chat)) return;

  // Add the message to the queue
  if (!messageQueue[chatId]) {
    messageQueue[chatId] = [];
  }
  messageQueue[chatId].push(message);

  // React with "queued" if there are other messages in the queue
  if (messageQueue[chatId].length > 0) {
    await setStatusFor(message, "queued");
  }

  // Process the queue if not already processing
  if (!isProcessingMessage) {
    await processMessageQueue(chatId);
  }
});

async function processMessageQueue(chatId: string) {
  isProcessingMessage = true;

  while (messageQueue[chatId] && messageQueue[chatId].length > 0) {
    const message = messageQueue[chatId].shift();
    if (message) {
      await handleMessageWithQueue(message);
    }
  }

  isProcessingMessage = false;
}

async function handleMessageWithQueue(message: Message) {
  const chat = await message.getChat();
  const chatId = chat.id._serialized;

  // User exists and questionnaire is completed, proceed with normal message handling
  const isCommand = message.body.startsWith(CMD_PREFIX);
  if (isCommand) {
    await handleCommand(message);
  } else {
    await handleMessage(message);
  }
}
