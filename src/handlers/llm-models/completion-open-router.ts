import { Message } from "whatsapp-web.js";
import { chain } from "../../clients/open-router";
import { STREAM_RESPONSES } from "../../constants";

export async function getCompletionWithOpenRouter(
  message: Message,
  context: string,
  streamingReply: Message
) {
  let messageWithContext = context + message.body;
  let tokenBuffer: string[] = ["..."];

  let response = await chain.call(
    { input: messageWithContext },
    {
      callbacks: [
        {
          async handleLLMNewToken(token: string) {
            if (STREAM_RESPONSES !== "true") return;

            // Buffer the token
            tokenBuffer.push(token);

            // Update streamingReply with buffered tokens
            const updatedMessage = tokenBuffer.join("");

            // Edit the streamingReply with the updated message
            await streamingReply.edit(updatedMessage);
          },
        },
      ],
    }
  );

  return response.text;
}
