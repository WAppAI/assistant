import { AgentExecutor } from "langchain/agents";
import { formatLogToString } from "langchain/agents/format_scratchpad/log";
import { ReActSingleInputOutputParser } from "langchain/agents/react/output_parser";
import { ChatOpenAI } from "langchain/chat_models/openai";
import {
  BufferWindowMemory,
  ChatMessageHistory,
  ConversationSummaryMemory,
} from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import {
  AIMessage,
  AgentStep,
  BaseMessage,
  HumanMessage,
} from "langchain/schema";
import { RunnableSequence } from "langchain/schema/runnable";
import { SearchApi } from "langchain/tools";
import { renderTextDescription } from "langchain/tools/render";
import {
  OPENROUTER_API_KEY,
  OPENROUTER_MEMORY_TYPE,
  OPENROUTER_MSG_MEMORY_LIMIT,
  OPEN_ROUTER_SYSTEM_MESSAGE,
  SEARCH_API,
  SUMMARY_LLM_MODEL,
} from "../constants";
import {
  getLLMModel,
  getOpenRouterConversationFor,
  getOpenRouterMemoryFor,
} from "../crud/conversation";

const OPENROUTER_BASE_URL = "https://openrouter.ai";

const tools = [
  new SearchApi(SEARCH_API, {
    engine: "google_news",
  }),
];
const toolNames = tools.map((tool) => tool.name);

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
  const conversation = await getOpenRouterConversationFor(chat);
  let memory;

  if (OPENROUTER_MEMORY_TYPE === "summary") {
    const summaryLLM = new ChatOpenAI(
      {
        modelName: SUMMARY_LLM_MODEL,
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
      basePath: `${OPENROUTER_BASE_URL}/api/v1`,
    }
  );

  const modelWithStop = openRouterChat.bind({
    stop: ["\nObservation"],
  });
  const memory = await createMemoryForOpenRouter(chat);

  const systemMessageOpenRouter = PromptTemplate.fromTemplate(` 
${OPEN_ROUTER_SYSTEM_MESSAGE}

${context}`);

  const promptWithInputs = await systemMessageOpenRouter.partial({
    tools: renderTextDescription(tools),
    tool_names: toolNames.join(","),
  });

  const agent = RunnableSequence.from([
    {
      input: (i: {
        input: string;
        steps: AgentStep[];
        chat_history: BaseMessage[];
      }) => i.input,
      agent_scratchpad: (i: {
        input: string;
        steps: AgentStep[];
        chat_history: BaseMessage[];
      }) => formatLogToString(i.steps),
      chat_history: (i: {
        input: string;
        steps: AgentStep[];
        chat_history: BaseMessage[];
      }) => i.chat_history,
    },
    promptWithInputs,
    modelWithStop,
    new ReActSingleInputOutputParser({ toolNames }),
  ]);

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    memory,
  });

  return executor;
}
