// src/clients/tools/tool-send-messages.ts

import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { sock } from "../whatsapp";

const SendMessageSchema = z.object({
  phoneNumber: z.string().describe(
    `The phone number to which the message will be sent. Must be in international format.
      If you are usure about the country and area code, you must ask the user for clarification.
      The number should not include the + symbol. 
      **IMPORTANT:** Before sending a message, confirm with the user that he wants to send that message and the number you are going to send it to.
      Also informs him of the country code and area code of that number, and confirm with him that it is the correct number.
      `
  ),
  message: z
    .string()
    .describe(
      "Content of the message to send. All unicode (including emojis) are supported."
    ),
});

export class SendWhatsappMessageTool extends StructuredTool {
  name = "SendMessageTool";
  description = "Sends a message to a specified WhatsApp phone number.";
  schema = SendMessageSchema;

  async _call({
    phoneNumber,
    message,
  }: z.infer<typeof SendMessageSchema>): Promise<string> {
    try {
      if (!/^\d{1,15}$/.test(phoneNumber)) {
        console.error("Invalid phone number:", phoneNumber);
        return "Invalid phone number. Please provide a valid phone number in international format.";
      }

      const chatId = `${phoneNumber}@s.whatsapp.net`;
      await sock.sendMessage(chatId, {
        text: message,
      });
      return `Message sent to phone number: ${phoneNumber}`;
    } catch (error) {
      console.error("Error sending message:", error);
      return `There was an error sending the message: ${error}`;
    }
  }
}
