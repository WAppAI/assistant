import { createExecutorForOpenRouter } from "../../clients/open-router";
import {
  ASSISTANT_NAME,
  DEBUG_SUMMARY,
  OPENROUTER_MEMORY_TYPE,
  PULSE_FREQUENCY,
  PULSE_LLM_MODEL,
} from "../../constants";
import { prisma } from "../../clients/prisma";
import { whatsapp } from "../../clients/whatsapp";
import {
  createOpenRouterConversation,
  getOpenRouterConversationFor,
  updateOpenRouterConversation,
} from "../../crud/conversation";

export async function pulse(chatId: string, messageBody: string) {
  const pulseFrequencyInMinutes = PULSE_FREQUENCY / 60000;
  const executor = await createExecutorForOpenRouter(
    "",
    chatId,
    "luisotee/wa-assistant-tool-calling-pulse",
    PULSE_LLM_MODEL
  );
  const response = await executor.invoke({
    input: messageBody,
    ASSISTANT_NAME: ASSISTANT_NAME,
    context: "",
    PULSE_FREQUENCY: `${pulseFrequencyInMinutes} minutes`,
  });

  console.log("Pulse response: ", response.output);

  if (response.output.includes("false")) return;

  const conversation = await getOpenRouterConversationFor(chatId);

  if (OPENROUTER_MEMORY_TYPE === "summary") {
    let currentSummaryRaw = await executor.memory?.loadMemoryVariables({});
    let currentSummary = currentSummaryRaw?.chat_history;

    let currentSummaryArray = currentSummary.map((message: any) => {
      return {
        [message.constructor.name]: message.content,
      };
    });

    if (DEBUG_SUMMARY === "true") {
      console.log("Current summary: ", currentSummaryArray);
    }

    if (conversation) {
      await updateOpenRouterConversation(
        chatId,
        JSON.stringify(currentSummaryArray)
      ); // Updates the conversation
    } else {
      await createOpenRouterConversation(
        chatId,
        JSON.stringify(currentSummaryArray)
      ); // Creates the conversation
    }
  } else {
    let chatHistoryRaw = await executor.memory?.loadMemoryVariables({});
    let chatHistory: any[] = chatHistoryRaw?.chat_history;

    let chatHistoryArray = chatHistory.map((message) => {
      return {
        [message.constructor.name]: message.content,
      };
    });

    if (conversation) {
      await updateOpenRouterConversation(
        chatId,
        JSON.stringify(chatHistoryArray)
      ); // Updates the conversation
    } else {
      await createOpenRouterConversation(
        chatId,
        JSON.stringify(chatHistoryArray)
      ); // Creates the conversation
    }
  }

  whatsapp.sendMessage(chatId, response.output);
}

export async function pulseForAllConversations(messageBody: string) {
  const conversations = await prisma.openRouterConversation.findMany();
  for (const conversation of conversations) {
    await pulse(conversation.waChatId, messageBody);
  }
}
