import { chain } from "../../clients/open-router";

export async function getCompletionWithOpenRouter(messageText: string) {
  let response = await chain.call({ input: messageText });

  return response.text;
}
