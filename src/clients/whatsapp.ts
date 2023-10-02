import qrcode from "qrcode";
import WAWebJS from "whatsapp-web.js";
import { handleMessage } from "../handlers/message";
import { handleSelfMessage } from "../handlers/message/self";
import { BOT_PREFIX } from "../constants";
import { handleCommand } from "../handlers/command";

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
});

whatsapp.on("message", async (message) => {
  const isCommand = message.body.startsWith("!");

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

  const isCommand = message.body.startsWith("!");

  if (isCommand) {
    return handleCommand(message);
  } else {
    return handleSelfMessage(message);
  }
});
