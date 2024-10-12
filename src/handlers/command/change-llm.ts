// module.js
import { stripIndents } from "common-tags";
import { CMD_PREFIX } from "../../constants";
import { getLLMModel, updateLLMModel } from "../../crud/conversation";
import { proto } from "@whiskeysockets/baileys";

export const LLM_OPTIONS = {
  "1": "bing",
  "2": "gpt-4o-mini",
  "3": "gpt-4o",
  "4": "o1-preview",
  "5": "o1-mini",
  "6": "gpt-4o-mini-github",
  "7": "gpt-4o-github",
  "8": "gemini-1.5-pro",
  "9": "gemini-1.5-flash",
  "10": "claude-3-5-sonnet-20240620",
  "11": "claude-3-opus-20240229",
  "12": "claude-3-haiku-20240307",
  "13": "llama3-groq-70b-8192-tool-use-preview",
  "14": "llava-v1.5-7b-4096-preview",
};

export async function handleChangeLLM(
  message: proto.IWebMessageInfo,
  args: keyof typeof LLM_OPTIONS
) {
  let newModel = "";
  let reply;
  const chatId = message.key.remoteJid as string;

  if (LLM_OPTIONS[args]) {
    newModel = LLM_OPTIONS[args];
    await updateLLMModel(chatId, newModel);
    reply = `LLM model changed to: ${newModel}`;
  } else if (!args.length) {
    const currentModel = await getLLMModel(chatId);
    reply = stripIndents`
      The current LLM model is: *${currentModel}*

      You can change it by selecting an option or typing the model name.

      Here are some of the popular models:

      *${CMD_PREFIX}change 1* for _bing_
      *${CMD_PREFIX}change 2* for _gpt-4o-mini_ *OpenAI API*
      *${CMD_PREFIX}change 3* for _gpt-4o_ *OpenAI API*
      *${CMD_PREFIX}change 4* for _o1-preview_ *OpenAI API*
      *${CMD_PREFIX}change 5* for _o1-mini_ *OpenAI API*
      *${CMD_PREFIX}change 6* for _gpt-4o-mini_ *GitHub (Azure) API*
      *${CMD_PREFIX}change 7* for _gpt-4o_ *GitHub (Azure) API*
      *${CMD_PREFIX}change 8* for _gemini-1.5-pro_ *Google API*
      *${CMD_PREFIX}change 9* for _gemini-1.5-flash_ *Google API*
      *${CMD_PREFIX}change 10* for _claude-3-5-sonnet_ *Anthropic API*
      *${CMD_PREFIX}change 11* for _claude-3-opus_ *Anthropic API*
      *${CMD_PREFIX}change 12* for _claude-3-haiku_ *Anthropic API*
      *${CMD_PREFIX}change 13* for _llama3-groq-70b_ *Groq API*
      *${CMD_PREFIX}change 14* for _llava-v1.5-7b_ *Groq API*

      You can also type the name of your desired model supported by OpenRouter, like *${CMD_PREFIX}change mistralai/mixtral-8x7b-instruct*

      See the list of available models of OpenRouter docs in https://openrouter.ai/docs#models.
    `;
  } else {
    newModel = args;
    await updateLLMModel(chatId, newModel);
    reply = `LLM model changed to: ${newModel}`;
  }

  return reply;
}
