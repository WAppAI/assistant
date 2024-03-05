import { SearchApi } from "@langchain/community/tools/searchapi";
import {
  ENABLE_GOOGLE_CALENDAR,
  GOOGLE_CALENDAR_CALENDAR_ID,
  GOOGLE_CALENDAR_CLIENT_EMAIL,
  GOOGLE_CALENDAR_PRIVATE_KEY,
  OPENAI_API_KEY,
  OPENROUTER_API_KEY,
  SEARCH_API
} from "../constants";
import { WebBrowser } from "langchain/tools/webbrowser";
import { ChatOpenAI, OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from "@langchain/community/tools/google_calendar";

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
let googleCalendarCreateTool = null;
let googleCalendarViewTool = null;


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


const embeddings = new OpenAIEmbeddings();

let searchTool = null;
if (SEARCH_API !== '') {
  searchTool = new SearchApi(SEARCH_API, {
    engine: "google_news",
  });
}

const webBrowserTool = new WebBrowser({ model, embeddings });

export const tools = [
  ...(searchTool ? [searchTool] : []),
  webBrowserTool,
  ...(googleCalendarCreateTool ? [googleCalendarCreateTool] : []),
  ...(googleCalendarViewTool ? [googleCalendarViewTool] : []),
];
export const toolNames = tools.map((tool) => tool.name);