import fetch from "node-fetch";
import { OPENROUTER_API_KEY, OPEN_ROUTER_SYSTEM_MESSAGE } from "../constants";

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  } | null>; // Allow for null values to handle potential unexpected response structures
}

export async function callOpenRouterAPI(
  messageText: string,
  model: string,
  context: string
) {
  const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  let completeContext = OPEN_ROUTER_SYSTEM_MESSAGE + context;
  console.log(" context = ", completeContext);
  const requestData = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://github.com/WAppAI/assistant",
      "X-Title": "Whatsapp Assistant",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: completeContext,
        },
        { role: "user", content: messageText },
      ],
    }),
  };

  try {
    const response = await fetch(apiUrl, requestData);
    const data: ChatCompletionResponse =
      (await response.json()) as ChatCompletionResponse; // Explicit type assertion

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      console.log(
        "data.choices[0].message.content:",
        data.choices[0].message.content
      );
      return data.choices[0].message.content;
    } else {
      console.error("API response format is unexpected:", data);
      return null; // You can return an appropriate value for this case
    }
  } catch (error) {
    console.error("API call error:", error);
    return null; // Handle the error as needed
  }
}
