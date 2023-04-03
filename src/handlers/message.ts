import { Message } from "whatsapp-web.js";
import { sydney } from "../clients/sydney";
import { config } from "../config";

export async function handleIncomingMessage(message: Message) {
  const chat = await message.getChat();
  const text = message.body;

  chat.sendSeen();
  chat.sendStateTyping();
  const sydneyResponse = await askSydney(text);
  await message.reply(sydneyResponse.response);
  chat.clearState();
}

async function askSydney(prompt: string) {
  const response = await sydney.sendMessage(prompt, {
    toneStyle: config.toneStyle,
    systemMessage: undefined,
    jailbreakConversationId: undefined,
    parentMessageId: undefined,
    onProgress: (token: string) => {
      // for debug purposes only
      process.stdout.write(token);
    }
  });

  return response;
}
