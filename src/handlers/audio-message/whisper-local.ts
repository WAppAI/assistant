import { execSync } from "child_process";
import * as path from "path";
import { fileURLToPath } from "url";
import { TRANSCRIPTION_LANGUAGE, TRANSCRIPTION_MODEL } from "../../constants";
import fs from "fs";

export async function handleAudioMessageWithWhisperLocal(wavPath: string) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const whisperPath = path.join(__dirname, "..", "..", "..", "whisper");
  const modelPath = path.join(whisperPath, "models", TRANSCRIPTION_MODEL);

  try {
    const command = `"${path.join(
      whisperPath,
      "main"
    )}" -m "${modelPath}" -f "${wavPath}" -l "${TRANSCRIPTION_LANGUAGE}" -nt`;

    const transcription = execSync(command, {
      encoding: "utf-8",
      stdio: "pipe", // Redirect output to the parent process
    });

    return transcription;
  } catch (error) {
    console.error("Error executing Whisper:", error);
    throw new Error("Error executing Whisper");
  } finally {
    // Delete the WAV file in the finally block, ensuring it's deleted even on error
    try {
      fs.unlinkSync(wavPath); // Delete the WAV file
    } catch (error) {
      console.error("Error deleting WAV file:", error);
    }
  }
}
