import { execSync } from "child_process";

export async function handleAudioMessageWithWhisperLocal(wavPath: string) {
  const transcription = execSync(
    `D:/programas/sydney-whatsapp-chatbot/whisper/main -m "D:/programas/sydney-whatsapp-chatbot/whisper/models/ggml-model-whisper-base.bin" -f D:/programas/sydney-whatsapp-chatbot/whisper/jfk.wav`,
    {
      encoding: "utf-8",
    }
  );
  console.log(transcription);
}
