// TS ignoring for now because i couldn't figure out how to get TS to compile them properly (src/types/bing-ai-client.d.ts)
// @ts-ignore
import { BingAIClient } from "@waylaidwanderer/chatgpt-api";
import KeyvSqlite from "@keyv/sqlite";
import { BING_COOKIES } from "../constants";

function convertFileToSQLite(string: string) {
  // Check if the inputString starts with "file:./"
  if (string.startsWith("file:./")) {
    // Replace "file:./" with "sqlite://./prisma/"
    return string.replace("file:./", "sqlite://./prisma/");
  } else {
    // If it doesn't start with "file:./", return the original string
    return string;
  }
}

const store = new KeyvSqlite({
  uri: convertFileToSQLite(process.env.DATABASE_URL as string),
  table: "cache",
});

export const bing = new BingAIClient({
  cookies: BING_COOKIES,
  cache: { store },
});
