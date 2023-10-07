import fs from "fs";
import { openai } from "../../clients/openai";
import { TRANSCRIPTION_LANGUAGE } from "../../constants";

export async function handleAudioMessageWithWhisperApi(wavPath: string) {
  try {
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(wavPath),
      language: TRANSCRIPTION_LANGUAGE,
    });
    return transcription.text;
  } finally {
    // Regardless of success or failure, attempt to delete the WAV file
    try {
      fs.unlinkSync(wavPath); // Delete the WAV file
    } catch (error) {
      console.error("Error deleting WAV file:", error);
    }
  }
}
