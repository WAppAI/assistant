// TS ignoring for now because i couldn't figure out how to get TS to compile them properly (src/types/bing-ai-client.d.ts)
// @ts-ignore
import { BingAIClient } from "@waylaidwanderer/chatgpt-api";
import KeyvSqlite from "@keyv/sqlite";

console.log(process.env.DATABASE_URL);
const store = new KeyvSqlite({
  uri: "sqlite://./prisma/bot.db",
  table: "cache",
});

export const bing = new BingAIClient({
  cookies: process.env.BING_COOKIES,
  cache: { store },
});
