import { BingAIClient } from "@waylaidwanderer/chatgpt-api";

export const bing = new BingAIClient({
  cookies: Bun.env.BING_COOKIES,
});
