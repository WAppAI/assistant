import { randomUUID } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { Message, MessageMedia } from "whatsapp-web.js";
import {
  BOT_PREFIX,
  REPLY_TRANSCRIPTION,
  TRANSCRIPTION_METHOD,
} from "../../constants";
import { convertOggToWav } from "./audio-helper";
import { handleAudioMessageWithWhisperApi } from "./whisper-api";
import { handleAudioMessageWithWhisperLocal } from "./whisper-local";
import { handleAudioMessageWithGroqApi } from "./whisper-groq";

export async function handleAudioMessage(
  media: MessageMedia,
  message: Message
) {
  const { data } = media;
  const tempdir = os.tmpdir();
  const filename = randomUUID();
  const oggPath = path.join(tempdir, `${filename}.ogg`);
  const wavPath = path.join(tempdir, `${filename}.wav`);

  fs.writeFileSync(oggPath, Buffer.from(data, "base64"));
  await convertOggToWav(oggPath, wavPath);

  const newMessageBody = `[system](#additional_instructions)\n
    The user has sent an audio message, here is the transcription:`;

  let transcribedAudio;

  if (TRANSCRIPTION_METHOD === "local") {
    try {
      transcribedAudio = await handleAudioMessageWithWhisperLocal(wavPath);
    } catch (error) {
      console.error(error);
      throw new Error("Error transcribing audio");
    }
  } else if (TRANSCRIPTION_METHOD === "whisper-api") {
    try {
      transcribedAudio = await handleAudioMessageWithWhisperApi(wavPath);
    } catch (error) {
      console.error(error);
      throw new Error("Error transcribing audio");
    }
  } else if (TRANSCRIPTION_METHOD === "whisper-groq") {
    try {
      transcribedAudio = await handleAudioMessageWithGroqApi(wavPath);
    } catch (error) {
      console.error(error);
      throw new Error("Error transcribing audio");
    }
  } else {
    throw new Error(
      "Invalid transcription method, TRANSCRIPTION_METHOD: " +
        TRANSCRIPTION_METHOD
    );
  }

  if (REPLY_TRANSCRIPTION === "true") {
    message.reply(`${BOT_PREFIX} Transcription:\n ${transcribedAudio}`);
  }

  return `${newMessageBody} ${transcribedAudio}`;
}
