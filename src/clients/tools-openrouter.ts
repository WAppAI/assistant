import { OpenAI } from "langchain/llms/openai";
import { SearchApi } from "@langchain/community/tools/searchapi";
import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from "langchain/tools/google_calendar";
import {
  GOOGLE_CALENDAR_CALENDAR_ID,
  GOOGLE_CALENDAR_CLIENT_EMAIL,
  GOOGLE_CALENDAR_PRIVATE_KEY,
  OPENROUTER_API_KEY,
  SEARCH_API,
} from "../constants";
import { Calculator } from "langchain/tools/calculator";

const OPENROUTER_BASE_URL = "https://openrouter.ai";

const model = new OpenAI(
  {
    modelName: "openai/gpt-3.5-turbo",
    temperature: 0,
    openAIApiKey: OPENROUTER_API_KEY,
  },
  {
    basePath: `${OPENROUTER_BASE_URL}/api/v1`,
  }
);

export const searchTool = new SearchApi(SEARCH_API, {
  engine: "google_news",
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
  model,
};

const CalendarCreateTool = new GoogleCalendarCreateTool(googleCalendarParams);

const CalendarViewTool = new GoogleCalendarViewTool(googleCalendarParams);

export const tools = [searchTool, CalendarCreateTool, CalendarViewTool, new Calculator()];
export const toolNames = tools.map((tool) => tool.name);
