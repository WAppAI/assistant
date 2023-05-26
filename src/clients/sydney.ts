// @ts-ignore
import { BingAIClient } from "@waylaidwanderer/chatgpt-api";
import KeyvSqlite from "@keyv/sqlite";
import dotenv from "dotenv";
dotenv.config();

export const sydney = new BingAIClient({
  cache: { store: new KeyvSqlite({ uri: "sqlite://./conversations_cache.sqlite" }) }
});
