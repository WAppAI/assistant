// see src/types/bing-ai-client.d.ts
// @ts-ignore
import type { BingAIClientResponse } from "@waylaidwanderer/chatgpt-api";
import { Message } from "whatsapp-web.js";
import { prisma } from "../clients/prisma";
import { bing } from "../clients/bing";
import { SYSTEM_MESSAGE } from "../constants";

export async function getCompletionFor(message: Message, context: string) {
  let completion: BingAIClientResponse;

  const chat = await message.getChat();

  const conversation = await prisma.bingConversation.findFirst({
    where: { waChatId: chat.id._serialized },
  });

  const waChat = await prisma.wAChat.findFirst({
    where: { id: chat.id._serialized },
    select: { jailbroken: true },
  });

  if (conversation) {
    await prisma.bingConversation.update({
      data: { waMessageId: message.id.id },
      where: { waChatId: conversation.waChatId },
    });

    if (waChat?.jailbroken)
      completion = await bing.sendMessage(message.body, {
        jailbreakConversationId: conversation.jailbreakId as string,
        parentMessageId: conversation.parentMessageId as string,
        toneStyle: "creative",
        context,
      });
    else
      completion = await bing.sendMessage(message.body, {
        conversationSignature: conversation.signature,
        conversationId: conversation.id,
        clientId: conversation.clientId,
        invocationId: conversation.invocationId,
        toneStyle: "creative",
        // apparently we can't give context to existing conversations when not jailbroken
        // context,
      });
  } else {
    completion = await bing.sendMessage(message.body, {
      jailbreakConversationId: waChat?.jailbroken ? true : undefined,
      systemMessage: waChat?.jailbroken ? SYSTEM_MESSAGE : undefined,
      toneStyle: "creative",
      context,
    });

    const chat = await message.getChat();

    if (!waChat)
      await prisma.wAChat.create({
        data: { id: chat.id._serialized },
      });

    await prisma.bingConversation.create({
      data: {
        id: completion.conversationId,
        clientId: completion.clientId,
        signature: completion.conversationSignature,
        invocationId: completion.invocationId,
        jailbreakId: completion.jailbreakConversationId,
        parentMessageId: completion.messageId,
        expiryTime: completion.conversationExpiryTime,
        waMessageId: message.id.id,
        waChatId: chat.id._serialized,
      },
    });
  }

  completion.response = removeFootnotes(completion.response);
  return completion;
}

function removeFootnotes(text: string): string {
  // Use a regular expression to match and remove the "[^x^]" pattern, where x is a number.
  const cleanedText = text.replace(/\[\^\d+\^\]/g, "");

  return cleanedText;
}
