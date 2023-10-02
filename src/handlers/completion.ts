// see src/types/bing-ai-client.d.ts
// @ts-ignore
import type { BingAIClientResponse } from "@waylaidwanderer/chatgpt-api";
import { Message } from "whatsapp-web.js";
import { prisma } from "../clients/prisma";
import { bing } from "../clients/bing";

export async function getCompletionFor(message: Message, context: string) {
  let completion: BingAIClientResponse;

  const chat = await message.getChat();

  const conversation = await prisma.bingConversation.findFirst({
    where: { waChatId: chat.id._serialized },
  });

  if (conversation) {
    await prisma.bingConversation.update({
      data: { waMessageId: message.id.id },
      where: { waChatId: conversation.waChatId },
    });

    completion = await bing.sendMessage(message.body, {
      conversationSignature: conversation.signature,
      conversationId: conversation.id,
      clientId: conversation.clientId,
      invocationId: conversation.invocationId,
      jailbreakConversationId: conversation.jailbreakId || undefined,
      parentMessageId: conversation.parentMessageId || undefined,
      toneStyle: "creative",
      // apparently we can't give context to existing conversations when not jailbroken
      // context,
    });
  } else {
    completion = await bing.sendMessage(message.body, {
      toneStyle: "creative",
      context,
    });

    const chat = await message.getChat();
    await prisma.bingConversation.create({
      data: {
        id: completion.conversationId,
        clientId: completion.clientId,
        signature: completion.conversationSignature,
        invocationId: completion.invocationId,
        jailbreakId: completion.jailbreakConversationId,
        expiryTime: completion.conversationExpiryTime,
        waMessageId: message.id.id,
        waChatId: chat.id._serialized,
      },
    });
  }

  return completion;
}
