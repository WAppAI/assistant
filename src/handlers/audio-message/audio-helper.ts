import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

export function convertOggToWav(oggPath: string, wavPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(oggPath)
      .toFormat("wav")
      .audioFrequency(16000) // Set the sample rate to 16 kHz
      .outputOptions("-acodec pcm_s16le")
      .output(wavPath)
      .on("end", () => {
        // This code will execute when the conversion is successful
        try {
          // Deletes the ogg file as it is no longer needed
          fs.unlinkSync(oggPath);
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject)
      .run();
  });
}
