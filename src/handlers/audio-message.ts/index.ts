import { Message, MessageMedia } from "whatsapp-web.js";
import { BOT_PREFIX, TRANSCRIPTION_ENABLED } from "../../constants";
import { log } from "../../helpers/utils";

export async function handleAudioMessage(
  message: Message,
  media: MessageMedia,
  streamingReply: Message
) {
  /*const media = await message.downloadMedia(); // Downloads all media from the message
  if (message.hasMedia && media.mimetype.startsWith("audio/")) {
    if (TRANSCRIPTION_ENABLED === "true") {
      console.log("Transcription enabled");
      return;
    } else {
      throw new Error("Transcription not enabled");
    }
  }*/
}
