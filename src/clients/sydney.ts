// @ts-ignore
import { BingAIClient } from "@waylaidwanderer/chatgpt-api";
import dotenv from "dotenv";
dotenv.config();

export const sydney = new BingAIClient({
  userToken: process.env.BING_TOKEN
});
