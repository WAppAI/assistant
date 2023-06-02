import { randomUUID } from "crypto";
import { File, blobFromSync } from "fetch-blob/from.js";
import ffmpeg from "fluent-ffmpeg";
import FormData from "form-data";
import fs from "fs";
import fetch, { Headers } from "node-fetch";
import os from "os";
import path from "path";

async function convertOggToWav(
  oggPath: string,
  wavPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(oggPath)
      .toFormat("wav")
      .outputOptions("-acodec pcm_s16le")
      .output(wavPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

export async function audioTranscription(audioBuffer: Buffer): Promise<string> {
  const url = "https://api.openai.com/v1/audio/transcriptions";
  let language = "";

  const tempdir = os.tmpdir();
  const oggPath = path.join(tempdir, randomUUID() + ".ogg");
  const wavFilename = randomUUID() + ".wav";
  const wavPath = path.join(tempdir, wavFilename);
  fs.writeFileSync(oggPath, audioBuffer);
  try {
    await convertOggToWav(oggPath, wavPath);
  } catch (e) {
    console.log("erro", e);
    fs.unlinkSync(oggPath);
    return "";
  }

  // FormData
  const formData = new FormData();

  const fileStream = fs.createReadStream(wavPath);
  formData.append("file", fileStream, {
    filename: wavFilename,
    contentType: "audio/wav",
  });
  formData.append("model", "whisper-1");

  const headers = new Headers();
  headers.append("Authorization", `Bearer ${process.env.OPENAI_API_KEY}`);

  // Request options
  const options = {
    method: "POST",
    body: formData,
    headers,
  };

  let response;
  try {
    response = await fetch(url, options);
  } catch (e) {
    console.log(e);
  } finally {
    fs.unlinkSync(oggPath);
    fs.unlinkSync(wavPath);
  }

  if (!response || response.status != 200) {
    console.log("erro:", response);
    return "";
  }

  const transcription = await response.json();
  return transcription.text;
}
