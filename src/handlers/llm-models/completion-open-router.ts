import { chain, memory } from "../../clients/open-router";

export async function getCompletionWithOpenRouter(
  messageText: string,
  model: string,
  context: string
) {
  let response = await chain.call({ input: messageText });

  return response.text;
}
