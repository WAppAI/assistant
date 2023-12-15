import { AgentExecutor, ChatAgentOutputParser } from "langchain/agents";
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
  Assistant is a large language model trained by OpenAI.

Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.

Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.

Overall, Assistant is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.

TOOLS:
------

Assistant has access to the following tools:

{tools}

To use a tool, please use the following format:

\`\`\`
Thought: Do I need to use a tool? Yes
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
\`\`\`

When you have a response to say to the Human, or if you do not need to use a tool, you MUST use the format:

\`\`\`
Thought: Do I need to use a tool? No
Final Answer: [your response here]
\`\`\`

Begin!

Previous conversation history:
{chat_history}

New input: {input}
{agent_scratchpad}`);

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
