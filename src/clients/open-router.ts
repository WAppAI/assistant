import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
  AgentExecutor,
  createStructuredChatAgent,
  createToolCallingAgent,
} from "langchain/agents";
import { pull } from "langchain/hub";
import {
  BufferWindowMemory,
  ChatMessageHistory,
  ConversationSummaryMemory,
} from "langchain/memory";
import {
  DEFAULT_MODEL,
  MODEL_TEMPERATURE,
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
import { openAIToolCallingModels } from "./tools/tool-calling-models";
import { tools } from "./tools/tools-openrouter";

function parseMessageHistory(
  rawHistory: { [key: string]: string }[]
): (HumanMessage | AIMessage)[] {
  return rawHistory.map((messageObj) => {
    const messageType = Object.keys(messageObj)[0];
    const messageContent = messageObj[messageType];

    if (messageType === "HumanMessage") {
      return new HumanMessage(messageContent);
    } else {
      return new AIMessage(messageContent);
    }
  });
}

async function createMemoryForOpenRouter(chat: string) {
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
      returnMessages: true,
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

      const pastMessages = parseMessageHistory(JSON.parse(memoryString));
      memory.chatHistory = new ChatMessageHistory(pastMessages);
    }
  } else {
    let memoryString: BaseMessage[] = [];
    memory.chatHistory = new ChatMessageHistory(memoryString);
  }

  return memory;
}

export async function createExecutorForOpenRouter(
  context: string,
  chat: string
) {
  let llmModel = await getLLMModel(chat);
  if (!llmModel) {
    llmModel = DEFAULT_MODEL;
  }

  const memory = await createMemoryForOpenRouter(chat);

  let agent;
  let llm;
  let prompt;

  if (openAIToolCallingModels.includes(llmModel)) {
    prompt = await pull<ChatPromptTemplate>(
      "luisotee/wa-assistant-tool-calling"
    );

    llm = new ChatOpenAI(
      {
        modelName: llmModel,
        streaming: true,
        temperature: MODEL_TEMPERATURE,
        openAIApiKey: OPENROUTER_API_KEY,
      },
      {
        basePath: "https://openrouter.ai/api/v1",
      }
    );
    agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });
  } else {
    prompt = await pull<ChatPromptTemplate>("luisotee/wa-assistant");

    llm = new ChatOpenAI(
      {
        modelName: llmModel,
        streaming: true,
        temperature: MODEL_TEMPERATURE,
        openAIApiKey: OPENROUTER_API_KEY,
      },
      {
        basePath: "https://openrouter.ai/api/v1",
      }
    );
    agent = await createStructuredChatAgent({
      llm,
      tools,
      prompt,
    });
  }

  const executor = new AgentExecutor({
    agent,
    tools,
    memory,
    //verbose: true,
  });

  return executor;
}
