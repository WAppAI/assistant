import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
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
  ANTHROPIC_API_KEY,
  DEFAULT_MODEL,
  GOOGLE_API_KEY,
  GROQ_API_KEY,
  MODEL_TEMPERATURE,
  OPENAI_API_KEY,
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
import {
  anthropicToolCallingModels,
  googleToolCallingModels,
  groqToolCallingModels,
  openAIToolCallingModels,
} from "./tools/tool-calling-models";
import { tools } from "./tools/tools-openrouter";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";

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

  // OpenAI LLM with Tool Calling Agent
  if (openAIToolCallingModels.includes(llmModel) && OPENAI_API_KEY !== "") {
    console.log("Using OpenAI LLM");
    prompt = await pull<ChatPromptTemplate>(
      "luisotee/wa-assistant-tool-calling"
    );

    llm = new ChatOpenAI({
      modelName: llmModel,
      streaming: true,
      temperature: MODEL_TEMPERATURE,
      apiKey: OPENAI_API_KEY,
    });

    agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });
  }
  // Google LLM with Tool Calling Agent
  else if (
    googleToolCallingModels.includes(llmModel) &&
    GOOGLE_API_KEY !== ""
  ) {
    console.log("Using Google Generative AI");
    prompt = await pull<ChatPromptTemplate>(
      "luisotee/wa-assistant-tool-calling"
    );

    llm = new ChatGoogleGenerativeAI({
      modelName: llmModel,
      streaming: true,
      temperature: MODEL_TEMPERATURE,
      apiKey: GOOGLE_API_KEY,
    });

    agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });
  }
  // Anthropics LLM with Tool Calling Agent
  else if (
    anthropicToolCallingModels.includes(llmModel) &&
    ANTHROPIC_API_KEY !== ""
  ) {
    console.log("Using Anthropics LLM");
    prompt = await pull<ChatPromptTemplate>(
      "luisotee/wa-assistant-tool-calling"
    );

    llm = new ChatAnthropic({
      modelName: llmModel,
      streaming: true,
      temperature: MODEL_TEMPERATURE,
      apiKey: ANTHROPIC_API_KEY,
    });

    agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });
  }
  // Groq LLM with Tool Calling Agent
  else if (groqToolCallingModels.includes(llmModel) && GROQ_API_KEY !== "") {
    console.log("Using Groq LLM");
    prompt = await pull<ChatPromptTemplate>(
      "luisotee/wa-assistant-tool-calling"
    );

    llm = new ChatGroq({
      modelName: llmModel,
      streaming: true,
      temperature: MODEL_TEMPERATURE,
      apiKey: GROQ_API_KEY,
    });

    agent = await createToolCallingAgent({
      llm,
      tools,
      prompt,
    });
  }
  // OpenRouter LLMs without Tool Calling Agent, with Structured Agent
  else {
    console.log("Using OpenRouter LLM");
    prompt = await pull<ChatPromptTemplate>("luisotee/wa-assistant");

    llm = new ChatOpenAI(
      {
        modelName: llmModel,
        streaming: true,
        temperature: MODEL_TEMPERATURE,
        apiKey: OPENROUTER_API_KEY,
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
    // @ts-ignore
    agent,
    tools,
    memory,
    //verbose: true,
  });

  return executor;
}
