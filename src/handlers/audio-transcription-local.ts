import { execSync } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { convertOggToWav } from "./audio-transcription";

export async function transcribeAudioLocal(
  audioBuffer: Buffer
): Promise<string> {
  const folderPath = "./"; // Change this to specify the project folder
  const filename = randomUUID();

  const oggPath = path.join(folderPath, filename + ".ogg");
  fs.writeFileSync(oggPath, audioBuffer);

  const wavPath = path.join(folderPath, filename + ".wav");
  await convertOggToWav(oggPath, wavPath);

  // Deletes the ogg file as it is no longer needed
  fs.unlinkSync(oggPath);

  const output = execSync(
    `whisper ${wavPath} ${process.env.TRANSCRIPTION_LANGUAGE}`,
    {
      encoding: "utf-8",
    }
  );

  // Delete tmp file
  fs.unlinkSync(wavPath);

  // Delete whisper created tmp files
  const extensions = [
    ".srt",
    ".txt",
    ".vtt",
    ".json",
    ".srt.json",
    ".tsv",
    ".srt.efb",
  ];

  const parsedText = parseTextAfterTimeFrame(output);
  for (const extension of extensions) {
    const filePath = path.join(folderPath, `${filename}${extension}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  if (parsedText) {
    return parsedText;
  } else {
    return "[System] User tried to send an audio message, but the transcription failed. Please ask them to either write it in text or try again.";
  }
}

function parseTextAfterTimeFrame(text: string) {
  const textMatch = text.match(
    /\[(\d{2}:\d{2}\.\d{3})\s-->\s(\d{2}:\d{2}\.\d{3})\]\s(.+)/
  ); // Extract the text

  if (textMatch) {
    return textMatch[3].trim();
  }

  return null; // Return null if match is not found
}
