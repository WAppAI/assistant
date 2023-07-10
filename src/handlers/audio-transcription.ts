import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import os from "os";
import path from "path";
import { openai } from "../clients/openai";

export function convertOggToWav(oggPath: string, wavPath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(oggPath)
      .toFormat("wav")
      .outputOptions("-acodec pcm_s16le")
      .output(wavPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
}

export async function transcribeAudio(audioBuffer: Buffer) {
  const tempdir = os.tmpdir();
  const filename = randomUUID();

  const oggPath = path.join(tempdir, filename + ".ogg");
  fs.writeFileSync(oggPath, audioBuffer);

  const wavPath = path.join(tempdir, filename + ".wav");
  await convertOggToWav(oggPath, wavPath);

  // Deletes the ogg file as it is no longer needed
  fs.unlinkSync(oggPath);

  const transcription = await openai.createTranscription(
    fs.createReadStream(wavPath),
    "whisper-1"
  );
  return transcription.data.text;
}
