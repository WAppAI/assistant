// module.js
import { stripIndents } from "common-tags";
import { Message } from "whatsapp-web.js";
import { CMD_PREFIX } from "../../constants";
import { getLLMModel, updateLLMModel } from "../../crud/conversation";

const LLM_OPTIONS = {
  "1": "bing",
  "2": "openai/gpt-3.5-turbo",
  "3": "anthropic/claude-3-opus:beta",
  "4": "google/gemini-pro",
  "5": "anthropic/claude-3-sonnet:beta",
};

export async function handleChangeLLM(message: Message, args: string) {
  let newModel = "";
  let reply = message;
  const chat = await message.getChat();

  if ((LLM_OPTIONS as any)[args]) {
    newModel = (LLM_OPTIONS as any)[args];
    await updateLLMModel(chat.id._serialized, newModel);
    reply = await message.reply(`LLM model changed to: ${newModel}`);
  } else if (!args.length) {
    reply = await message.reply(stripIndents`
  The current LLM model is: *${await getLLMModel(chat.id._serialized)}*

  You can change it by selecting an option or typing the model name.

  Here are some of the popular models:

  *${CMD_PREFIX}change 1* for _bing_
  *${CMD_PREFIX}change 2* for _openai/gpt-3.5-turbo_
  *${CMD_PREFIX}change 3* for _anthropic/claude-3-opus_
  *${CMD_PREFIX}change 4* for _google/gemini-pro_
  *${CMD_PREFIX}change 5* for _anthropic/claude-3-sonnet_

  You can also type the name of your desired model, like *${CMD_PREFIX}change mistralai/mixtral-8x7b-instruct*

  See the list of available models at OpenRouter docs in https://openrouter.ai/docs#models.
`, chat.id._serialized, { linkPreview: false });
  } else {
    newModel = args;
    await updateLLMModel(chat.id._serialized, newModel);
    reply = await message.reply(`LLM model changed to: ${newModel}`);
  }

  return reply;
}
