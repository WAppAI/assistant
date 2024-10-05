import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
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
  GITHUB_OPENAI_API_KEY,
  GOOGLE_API_KEY,
  GROQ_API_KEY,
  MODEL_TEMPERATURE,
  OPENAI_API_KEY,
  OPENROUTER_API_KEY,
  OPENROUTER_MEMORY_TYPE,
  OPENROUTER_MSG_MEMORY_LIMIT,
  PROMPT_LANGCHAIN,
  SUMMARY_LLM_MODEL,
} from "../constants";
import {
  getLLMModel,
  getOpenRouterConversationFor,
  getOpenRouterMemoryFor,
  getCoreMemoryFor,
} from "../crud/conversation";
import {
  anthropicToolCallingModels,
  githubToolCallingModels,
  googleToolCallingModels,
  groqToolCallingModels,
  openAIToolCallingModels,
} from "./tools/tool-calling-models";
import { tools } from "./tools/tools-openrouter";

function parseMessageHistory(
  rawHistory: { [key: string]: string }[],
  coreMemory: string
): (HumanMessage | AIMessage)[] {
  const parsedMessages = rawHistory.map((messageObj) => {
    const messageType = Object.keys(messageObj)[0];
    const messageContent = messageObj[messageType];

    if (messageType === "HumanMessage") {
      return new HumanMessage(messageContent);
    } else {
      return new AIMessage(messageContent);
    }
  });

  // Prepend the core memory as an AIMessage
  const coreMemoryMessage = new AIMessage(`Your current core memory: 

<core_memory>
  ${coreMemory}
</core_memory>`);
  return [coreMemoryMessage, ...parsedMessages];
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
    const coreMemory = (await getCoreMemoryFor(chat)) || "";
    let memoryString = await getOpenRouterMemoryFor(chat);
    if (memoryString === undefined) return;

    try {
      const parsedMemory = JSON.parse(memoryString);
      const pastMessages = parseMessageHistory(parsedMemory, coreMemory);
      memory.chatHistory = new ChatMessageHistory(pastMessages);
    } catch (error) {
      //console.error("Failed to parse memoryString:", error);
      memory.chatHistory = new ChatMessageHistory([]);
    }
  } else {
    const coreMemory = (await getCoreMemoryFor(chat)) || "";
    let memoryString: BaseMessage[] = [new AIMessage(coreMemory)];
    memory.chatHistory = new ChatMessageHistory(memoryString);
  }

  return memory;
}

export async function createExecutorForOpenRouter(
  context: string,
  chat: string,
  customPrompt?: string
) {
  let llmModel = await getLLMModel(chat);
  if (!llmModel) {
    llmModel = DEFAULT_MODEL;
  }

  const memory = await createMemoryForOpenRouter(chat);

  let agent;
  let llm;
  let prompt;

  const promptToUse = customPrompt || PROMPT_LANGCHAIN;

  console.log("Prompt to use:", promptToUse);

  switch (true) {
    case openAIToolCallingModels.includes(llmModel) && OPENAI_API_KEY !== "":
      prompt = await pull<ChatPromptTemplate>(promptToUse);

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
      break;

    case githubToolCallingModels.includes(llmModel) &&
      GITHUB_OPENAI_API_KEY !== "":
      prompt = await pull<ChatPromptTemplate>(promptToUse);
      const azureModelName = llmModel.replace("-github", ""); // Remove the -azure flag

      llm = new ChatOpenAI(
        {
          modelName: azureModelName,
          streaming: true,
          temperature: MODEL_TEMPERATURE,
          apiKey: GITHUB_OPENAI_API_KEY,
        },
        {
          basePath: "https://models.inference.ai.azure.com",
        }
      );
      agent = await createToolCallingAgent({
        llm,
        tools,
        prompt,
      });
      break;

    case googleToolCallingModels.includes(llmModel) && GOOGLE_API_KEY !== "":
      prompt = await pull<ChatPromptTemplate>(promptToUse);

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
      break;

    case anthropicToolCallingModels.includes(llmModel) &&
      ANTHROPIC_API_KEY !== "":
      prompt = await pull<ChatPromptTemplate>(promptToUse);

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
      break;

    case groqToolCallingModels.includes(llmModel) && GROQ_API_KEY !== "":
      prompt = await pull<ChatPromptTemplate>(promptToUse);

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
      break;

    default:
      prompt = await pull<ChatPromptTemplate>(promptToUse);

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
      break;
  }

  const executor = new AgentExecutor({
    agent,
    tools,
    memory,
    //verbose: true,
  });

  return executor;
}
