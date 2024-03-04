import { SearchApi } from "@langchain/community/tools/searchapi";
import {
  OPENROUTER_API_KEY,
  SEARCH_API
} from "../constants";
import { WebBrowser } from "langchain/tools/webbrowser";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai";

const model = new ChatOpenAI(
  {
    modelName: "openai/gpt-3.5-turbo",
    temperature: 0,
    openAIApiKey: OPENROUTER_API_KEY,
  },
  {
    basePath: `${OPENROUTER_BASE_URL}/api/v1`,
  }
);

const embeddings = new OpenAIEmbeddings();

let searchTool = null;
if (SEARCH_API !== '') {
  searchTool = new SearchApi(SEARCH_API, {
    engine: "google_news",
  });
}

const webBrowserTool = new WebBrowser({ model, embeddings });

export const tools = [...(searchTool ? [searchTool] : []), webBrowserTool];
export const toolNames = tools.map((tool) => tool.name);