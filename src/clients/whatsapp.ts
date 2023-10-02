import qrcode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";
import { handleMessage } from "../handlers/message";
import { handleSelfMessage } from "../handlers/message/self";

export const whatsapp = new Client({
  authStrategy: new LocalAuth(),

  puppeteer: {
    handleSIGTERM: false,
    handleSIGINT: false,
    executablePath: Bun.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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

whatsapp.on("message", handleMessage);
whatsapp.on("message_create", handleSelfMessage);
