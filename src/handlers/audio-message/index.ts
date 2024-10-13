import { randomUUID } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import {
  BOT_PREFIX,
  REPLY_TRANSCRIPTION,
  TRANSCRIPTION_METHOD,
} from "../../constants";
import { convertOggToWav } from "./audio-helper";
import { handleAudioMessageWithWhisperApi } from "./whisper-api";
import { handleAudioMessageWithGroqApi } from "./whisper-groq";
import { handleAudioMessageWithWhisperLocal } from "./whisper-local";
import {
  makeWASocket,
  downloadMediaMessage,
  DisconnectReason,
  useMultiFileAuthState,
  type proto,
  WASocket,
} from "@whiskeysockets/baileys";
import { sock } from "../../clients/new-whatsapp";

// Function to handle audio messages
export async function handleAudioMessage(
  message: proto.IWebMessageInfo,
  media: Buffer
) {
  const messageContent = message.message?.audioMessage;
  if (!messageContent) {
    throw new Error("No audio message found in the provided message");
  }

  const tempdir = os.tmpdir();
  const filename = randomUUID();
  const oggPath = path.join(tempdir, `${filename}.ogg`);
  const wavPath = path.join(tempdir, `${filename}.wav`);

  fs.writeFileSync(oggPath, new Uint8Array(media));
  await convertOggToWav(oggPath, wavPath);

  const newMessageBody = `[system](#additional_instructions)\n
    The user has sent an audio message, here is the transcription:`;

  let transcribedAudio;

  try {
    if (TRANSCRIPTION_METHOD === "local") {
      transcribedAudio = await handleAudioMessageWithWhisperLocal(wavPath);
    } else if (TRANSCRIPTION_METHOD === "whisper-api") {
      transcribedAudio = await handleAudioMessageWithWhisperApi(wavPath);
    } else if (TRANSCRIPTION_METHOD === "whisper-groq") {
      transcribedAudio = await handleAudioMessageWithGroqApi(wavPath);
    } else {
      throw new Error(
        "Invalid transcription method, TRANSCRIPTION_METHOD: " +
          TRANSCRIPTION_METHOD
      );
    }
  } catch (error) {
    console.error(error);
    return "Error transcribing audio";
  }

  if (REPLY_TRANSCRIPTION === "true") {
    if (message.key.remoteJid) {
      await sock.sendMessage(message.key.remoteJid, {
        text: `${BOT_PREFIX} Transcription:\n ${transcribedAudio}`,
      });
    } else {
      console.warn("remoteJid is undefined");
    }
  }

  return `${newMessageBody} ${transcribedAudio}`;
}
