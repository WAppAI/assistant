import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationSummaryMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import {
  LLM_MODEL,
  OPENROUTER_API_KEY,
  OPEN_ROUTER_SYSTEM_MESSAGE,
} from "../constants";

export const OPENROUTER_BASE_URL = "https://openrouter.ai";

export const openRouterChat = new ChatOpenAI(
  {
    modelName: LLM_MODEL,
    streaming: true,
    openAIApiKey: OPENROUTER_API_KEY,
  },
  {
    basePath: `${OPENROUTER_BASE_URL}/api/v1`,
  }
);

export const memory = new ConversationSummaryMemory({
  memoryKey: "chat_history",
  llm: openRouterChat,
});

const openRouterContext = OPEN_ROUTER_SYSTEM_MESSAGE;

const prompt = PromptTemplate.fromTemplate(` 
    ${openRouterContext}

    The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

    Current conversation:
    {chat_history}
    Human: {input}
    AI:`);

export const chain = new LLMChain({ llm: openRouterChat, prompt, memory });
