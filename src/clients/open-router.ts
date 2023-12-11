import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferWindowMemory, ChatMessageHistory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import {
  LLM_MODEL,
  OPENROUTER_API_KEY,
  OPENROUTER_MSG_MEMORY_LIMIT,
  OPEN_ROUTER_SYSTEM_MESSAGE,
} from "../constants";
import {
  getOpenRouterConversationFor,
  getOpenRouterMemoryFor,
} from "../crud/conversation";
import { AIMessage, HumanMessage } from "langchain/schema";

const OPENROUTER_BASE_URL = "https://openrouter.ai";

function parseMessageHistory(rawHistory: string): (HumanMessage | AIMessage)[] {
  const lines = rawHistory.split("\n");
  return lines
    .map((line) => {
      if (line.startsWith("Human: ")) {
        return new HumanMessage(line.replace("Human: ", ""));
      } else if (line.startsWith("AI: ")) {
        return new AIMessage(line.replace("AI: ", ""));
      }
      console.warn(
        "Invalid message format when loading messages from OpenRouter: ",
        line
      );
    })
    .filter(
      (message): message is HumanMessage | AIMessage => message !== undefined
    );
}

const openRouterChat = new ChatOpenAI(
  {
    modelName: LLM_MODEL,
    //streaming: true,
    temperature: 0.7,
    openAIApiKey: OPENROUTER_API_KEY,
  },
  {
    basePath: `${OPENROUTER_BASE_URL}/api/v1`,
  }
);

async function createMemoryForOpenRouter(chat: string) {
  const conversation = await getOpenRouterConversationFor(chat);

  const memory = new BufferWindowMemory({
    memoryKey: "chat_history",
    inputKey: "input",
    k: OPENROUTER_MSG_MEMORY_LIMIT,
  });

  if (conversation) {
    let memoryString = await getOpenRouterMemoryFor(chat);
    if (memoryString === undefined) return;

    const pastMessages = parseMessageHistory(memoryString);
    memory.chatHistory = new ChatMessageHistory(pastMessages);
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
