import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  BufferWindowMemory,
  ChatMessageHistory,
  ConversationSummaryMemory,
} from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { AIMessage, HumanMessage } from "langchain/schema";
import {
  LLM_MODEL,
  OPENROUTER_API_KEY,
  OPENROUTER_MEMORY_TYPE,
  OPENROUTER_MSG_MEMORY_LIMIT,
  OPEN_ROUTER_SYSTEM_MESSAGE,
} from "../constants";
import {
  getOpenRouterConversationFor,
  getOpenRouterMemoryFor,
} from "../crud/conversation";

const OPENROUTER_BASE_URL = "https://openrouter.ai";

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

const openRouterChat = new ChatOpenAI(
  {
    modelName: LLM_MODEL,
    streaming: true,
    temperature: 0.7,
    openAIApiKey: OPENROUTER_API_KEY,
  },
  {
    basePath: `${OPENROUTER_BASE_URL}/api/v1`,
  }
);

async function createMemoryForOpenRouter(chat: string) {
  const conversation = await getOpenRouterConversationFor(chat);
  let memory;

  if (OPENROUTER_MEMORY_TYPE === "summary") {
    const summaryLLM = new ChatOpenAI(
      {
        modelName: "openai/gpt-3.5-turbo",
        streaming: true,
        temperature: 0.7,
        openAIApiKey: OPENROUTER_API_KEY,
      },
      {
        basePath: `${OPENROUTER_BASE_URL}/api/v1`,
      }
    );

    memory = new ConversationSummaryMemory({
      memoryKey: "chat_history",
      inputKey: "input",
      llm: summaryLLM,
    });
  } else {
    memory = new BufferWindowMemory({
      memoryKey: "chat_history",
      inputKey: "input",
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
  }

  return memory;
}

export async function createChainForOpenRouter(context: string, chat: string) {
  const memory = await createMemoryForOpenRouter(chat);
  const systemMessageOpenRouter = PromptTemplate.fromTemplate(` 
${OPEN_ROUTER_SYSTEM_MESSAGE}

${context}

## Current conversation:
    {chat_history}
    Human: {input}
    AI:

    `);

  return new LLMChain({
    llm: openRouterChat,
    prompt: systemMessageOpenRouter,
    memory,
  });
}
