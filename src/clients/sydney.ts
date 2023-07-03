// @ts-ignore
import { BingAIClient } from "@waylaidwanderer/chatgpt-api";
import KeyvSqlite from "@keyv/sqlite";
import dotenv from "dotenv";
dotenv.config();

const BING_COOKIES = process.env.BING_COOKIES;
const BING_TOKEN = BING_COOKIES ? undefined : process.env.BING_TOKEN;

export const sydney = new BingAIClient({
  cookies: BING_COOKIES,
  userToken: BING_TOKEN,
  cache: {
    store: new KeyvSqlite({ uri: "sqlite://./conversations_cache.sqlite" }),
  },
});
