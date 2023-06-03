import qrcode from "qrcode-terminal";
import cli from "../clients/cli";
import { Client } from "whatsapp-web.js";
import { handleMessage } from "../handlers/message";
import { handleCommand } from "../handlers/command";

export const whatsapp = new Client({
  puppeteer: {
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox"
    ],
    userDataDir: "./puppeteer"
  }
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
  const sender = message.from;
  console.log(`Message received from ${sender}`);

  if (sender == "status@broadcast") {
    console.log("Its a status broadcast, ignoring...");
    return;
  }

  if (message.body.startsWith("!")) {
    const [command, ...args] = message.body.split(" ");
    await handleCommand(message, command, args.join(" "));
  } else {
    await handleMessage(message);
  }
});
