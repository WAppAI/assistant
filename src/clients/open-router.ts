import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationSummaryMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import {
  LLM_MODEL,
  OPENROUTER_API_KEY,
  OPEN_ROUTER_SYSTEM_MESSAGE,
} from "../constants";
import {
  getOpenRouterConversationFor,
  getOpenRouterMemoryFor,
} from "../crud/conversation";

const OPENROUTER_BASE_URL = "https://openrouter.ai";

const openRouterChat = new ChatOpenAI(
  {
    modelName: LLM_MODEL,
    //streaming: true,
    temperature: 1,
    openAIApiKey: OPENROUTER_API_KEY,
  },
  {
    basePath: `${OPENROUTER_BASE_URL}/api/v1`,
  }
);

async function createMemoryForOpenRouter(chat: string) {
  const conversation = await getOpenRouterConversationFor(chat);

  const memory = new ConversationSummaryMemory({
    memoryKey: "chat_history",
    inputKey: "input",
    llm: openRouterChat,
  });

  if (conversation) {
    let memoryString = await getOpenRouterMemoryFor(chat);
    if (memoryString === undefined) return;
    memory.buffer = memoryString;
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
