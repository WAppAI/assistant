import fs from "fs";
import { openai } from "../../clients/openai";
import { TRANSCRIPTION_LANGUAGE } from "../../constants";
import Groq from "groq-sdk";

export async function handleAudioMessageWithGroqApi(wavPath: string) {
  console.log("Transcribing audio with Groq API");
  try {
    const groq = new Groq()

    const transcriptionOptions: any = {
      file: fs.createReadStream(wavPath),
      model: "whisper-large-v3",
      //prompt: "Specify context or spelling", // Optional
      response_format: "json", // Optional
      temperature: 0.0, // Optional
    };

    if (TRANSCRIPTION_LANGUAGE !== "auto") {
      transcriptionOptions.language = TRANSCRIPTION_LANGUAGE;
    }

    const transcription =
      await groq.audio.transcriptions.create(transcriptionOptions);
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
