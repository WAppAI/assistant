import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, messageToOpenAIRole } from "@langchain/openai";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import {
  BufferWindowMemory,
  ChatMessageHistory,
  ConversationSummaryMemory,
} from "langchain/memory";
import {
  OPENROUTER_API_KEY,
  OPENROUTER_MEMORY_TYPE,
  OPENROUTER_MSG_MEMORY_LIMIT,
  SUMMARY_LLM_MODEL,
} from "../constants";
import {
  getLLMModel,
  getOpenRouterConversationFor,
  getOpenRouterMemoryFor,
} from "../crud/conversation";
import { tools } from "./tools-openrouter";

function parseMessageHistory(rawHistory: string): (HumanMessage | AIMessage)[] {
  const lines = rawHistory.split("\n");
  return lines
    .map((line) => {
      if (line.startsWith("Human: ")) {
        return new HumanMessage(line.replace("Human: ", ""));
      } else {
        return new AIMessage(line.replace("AI: ", ""));
      }
    })
    .filter(
      (message): message is HumanMessage | AIMessage => message !== undefined
    );
}

async function createMemoryForOpenRouter(chat: string) {
  console.log("Creating memory for OpenRouter");
  const conversation = await getOpenRouterConversationFor(chat);
  let memory;

  if (OPENROUTER_MEMORY_TYPE === "summary") {
    const summaryLLM = new ChatOpenAI(
      {
        modelName: SUMMARY_LLM_MODEL,
        temperature: 0,
        openAIApiKey: OPENROUTER_API_KEY,
      },
      {
        basePath: "https://openrouter.ai/api/v1",
      }
    );

    memory = new ConversationSummaryMemory({
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
      llm: summaryLLM,
    });
  } else {
    memory = new BufferWindowMemory({
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
      returnMessages: true,
      k: OPENROUTER_MSG_MEMORY_LIMIT,
    });
  }

  if (conversation) {
    if (memory instanceof ConversationSummaryMemory) {
      let memoryString = await getOpenRouterMemoryFor(chat);
      if (memoryString === undefined) return;
      memory.buffer = memoryString;
    } else {
      let memoryString = await getOpenRouterMemoryFor(chat);
      if (memoryString === undefined) return;

      const pastMessages = parseMessageHistory(memoryString);
      memory.chatHistory = new ChatMessageHistory(pastMessages);
    }
  } else {
    console.log("Creating new memory");
    let memoryString: BaseMessage[] = [];
    memory.chatHistory = new ChatMessageHistory(memoryString);
  }

  return memory;
}

export async function createExecutorForOpenRouter(
  context: string,
  chat: string
) {
  const llmModel = await getLLMModel(chat);
  const openRouterChat = new ChatOpenAI(
    {
      modelName: llmModel,
      streaming: true,
      temperature: 0.7,
      openAIApiKey: OPENROUTER_API_KEY,
    },
    {
      basePath: "https://openrouter.ai/api/v1",
    }
  );

  const prompt = await pull<ChatPromptTemplate>("luisotee/wa-assistant");

  const memory = await createMemoryForOpenRouter(chat);

  const agent = await createStructuredChatAgent({
    llm: openRouterChat,
    tools,
    prompt,
  });

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    memory,
    //verbose: true,
  });

  return executor;
}
