import qrcode from "qrcode-terminal";
import cli from "../clients/cli";
import { Client } from "whatsapp-web.js";
import { handleMessage } from "../handlers/message";
import { handleCommand } from "../handlers/command";
import fs from "fs";
import { audioTranscription } from "../handlers/audio-transcription";
import { File } from "buffer";

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
  const sender = message.from;

  if (message.hasMedia) {
    //Check if it's a media message
    const media = await message.downloadMedia();

    if (media && media.mimetype.startsWith("audio/")) {
      if (process.env.TRANSCRIPTION_ENABLED === "true") {
        const mediaBuffer = Buffer.from(media.data, "base64");
        let res = await audioTranscription(mediaBuffer);
        console.log("voice message:", res);
        message.body = res;
      } else {
        await message.reply(
          "You sent a voice message, but it's deactivated in the code."
        );
        return;
      }
    }
  }
  const text = message.body;
  console.log(`Message received from ${sender}`);

  if (sender == "status@broadcast") {
    console.log("Its a status broadcast, ignoring...");
    return;
  }

  if (text.startsWith("!")) {
    const [command, ...args] = text.split(" ");
    await handleCommand(message, command, args.join(" "));
  } else {
    await handleMessage(message);
  }
});
