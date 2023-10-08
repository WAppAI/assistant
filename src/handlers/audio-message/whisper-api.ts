import fs from "fs";
import { openai } from "../../clients/openai";
import { TRANSCRIPTION_LANGUAGE } from "../../constants";

export async function handleAudioMessageWithWhisperApi(wavPath: string) {
  try {
    // Replace TRANSCRIPTION_LANGUAGE with an empty string if it's set to "auto"
    const language =
      TRANSCRIPTION_LANGUAGE === "auto" ? "" : TRANSCRIPTION_LANGUAGE;

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(wavPath),
      language: language,
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
