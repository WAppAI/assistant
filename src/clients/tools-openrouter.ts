import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from "@langchain/community/tools/google_calendar";
import { SearchApi } from "@langchain/community/tools/searchapi";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import {
  ChatOpenAI,
  DallEAPIWrapper,
  OpenAI,
  OpenAIEmbeddings,
} from "@langchain/openai";
import { Calculator } from "@langchain/community/tools/calculator";
import { WebBrowser } from "langchain/tools/webbrowser";
import {
  DALLE_MODEL,
  ENABLE_DALLE_TOOL,
  ENABLE_GOOGLE_CALENDAR,
  ENABLE_GOOGLE_ROUTES,
  ENABLE_WEB_BROWSER_TOOL,
  GOOGLE_CALENDAR_CALENDAR_ID,
  GOOGLE_CALENDAR_CLIENT_EMAIL,
  GOOGLE_CALENDAR_PRIVATE_KEY,
  OPENAI_API_KEY,
  OPENROUTER_API_KEY,
  SEARCH_API,
} from "../constants";
import { GoogleRoutesAPI } from "@langchain/community/tools/google_routes";

let googleCalendarCreateTool = null;
let googleCalendarViewTool = null;
let searchTool = null;
let webBrowserTool = null;
let dalleTool = null;
let googleRoutesTool = null;

if (ENABLE_DALLE_TOOL === "true") {
  dalleTool = new DallEAPIWrapper({
    n: 1, // Default
    modelName: DALLE_MODEL, // Default
    openAIApiKey: OPENAI_API_KEY, // Default
  });
}

if (ENABLE_GOOGLE_ROUTES === "true") {
  googleRoutesTool = new GoogleRoutesAPI();
}

if (ENABLE_WEB_BROWSER_TOOL === "true") {
  const model = new ChatOpenAI(
    {
      modelName: "openai/gpt-3.5-turbo",
      temperature: 0,
      openAIApiKey: OPENROUTER_API_KEY,
    },
    {
      basePath: "https://openrouter.ai/api/v1",
    }
  );
  const embeddings = new OpenAIEmbeddings();
  webBrowserTool = new WebBrowser({ model, embeddings });
}

if (ENABLE_GOOGLE_CALENDAR === "true") {
  const googleCalendarModel = new OpenAI({
    temperature: 0,
    openAIApiKey: OPENAI_API_KEY,
  });

  const googleCalendarParams = {
    credentials: {
      clientEmail: GOOGLE_CALENDAR_CLIENT_EMAIL,
      privateKey: GOOGLE_CALENDAR_PRIVATE_KEY,
      calendarId: GOOGLE_CALENDAR_CALENDAR_ID,
    },
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    model: googleCalendarModel,
  };

  googleCalendarCreateTool = new GoogleCalendarCreateTool(googleCalendarParams);
  googleCalendarViewTool = new GoogleCalendarViewTool(googleCalendarParams);
}

if (SEARCH_API !== "") {
  searchTool = new SearchApi(SEARCH_API, {
    engine: "google_news",
  });
}

const calculatorTool = new Calculator();

const wikipediaTool = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 4000,
});

export const tools = [
  ...(searchTool ? [searchTool] : []),
  ...(webBrowserTool ? [webBrowserTool] : []),
  ...(googleCalendarCreateTool ? [googleCalendarCreateTool] : []),
  ...(googleCalendarViewTool ? [googleCalendarViewTool] : []),
  ...(dalleTool ? [dalleTool] : []),
  ...(googleRoutesTool ? [googleRoutesTool] : []),
  wikipediaTool,
  calculatorTool,
];
export const toolNames = tools.map((tool) => tool.name);
