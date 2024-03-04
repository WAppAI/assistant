import { SearchApi } from "@langchain/community/tools/searchapi";
import {
  SEARCH_API
} from "../constants";

let searchTool = null;
if (SEARCH_API !== '') {
  searchTool = new SearchApi(SEARCH_API, {
    engine: "google_news",
  });
}

export const tools = searchTool ? [searchTool] : [];
export const toolNames = tools.map((tool) => tool.name);