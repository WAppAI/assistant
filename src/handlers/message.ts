import { Contact, Message } from "whatsapp-web.js";
import { serializeError } from "serialize-error";
import { promptTracker } from "../clients/prompt";
import { sydney } from "../clients/sydney";
import { config } from "../config";
import { react } from "../utils";
import type { SourceAttribution, IOptions, SydneyResponse } from "../types";

function appendSources(sources: SourceAttribution[]) {
  let sourcesString = "\n\n";

  sources.forEach((source, index) => {
    sourcesString += `[${index + 1}]: ${source.seeMoreUrl}\n`;
  });

  return sourcesString;
}

function replaceMentions(
  message: Message,
  mentions: Contact[],
  botMention: Contact
) {
  const botNumber = botMention?.id.user;
  message.body = message.body.replace(`@${botNumber}`, "Sydney");

  const otherMentions = mentions.filter((mention) => !mention.isMe);
  otherMentions.forEach((mention) => {
    message.body = message.body.replace(
      `@${mention.id.user}`, // user ID, eg.: '@01234567890'
      `@${mention.pushname}` // WhatsApp's public user name, eg.: 'John'
    );
  });
}

async function updateConversationsCache(chatId: string, lastWAreplyId: string) {
  const onGoingConversation = await sydney.conversationsCache.get(chatId);
  await sydney.conversationsCache.set(chatId, {
    ...onGoingConversation,
    lastWAreplyId
  });
}

async function handleGroupMessage(message: Message) {
  const chat = await message.getChat();

  const mentions = await message.getMentions();
  const botMention = mentions.filter((mention) => mention.isMe).pop();
  const quotedMessage = await message.getQuotedMessage();
  const OnGoingConversation = await sydney.conversationsCache.get(
    chat.id._serialized
  );

  let isInThread = false;

  if (OnGoingConversation)
    isInThread = quotedMessage
      ? quotedMessage.id._serialized === OnGoingConversation.lastWAreplyId
      : false;

  if (!botMention && !isInThread) return false;

  replaceMentions(message, mentions, botMention as Contact);

  return true;
}

export async function handleMessage(message: Message) {
  const chat = await message.getChat();
  if (chat.isGroup) {
    const shouldReply = await handleGroupMessage(message);
    if (!shouldReply) return;
  }

  const pendingPrompts = promptTracker.listPendingPrompts(chat);
  if (pendingPrompts.length >= 1) {
    const lastPrompt = pendingPrompts.pop();

    lastPrompt?.prompt.then(async () => {
      await handleMessage(message);
    });

    await react(message, "queued");
    return;
  }

  await chat.sendSeen();
  await react(message, "working");

  const prompt = message.body;

  try {
    const { response, details } = await promptTracker.track(
      prompt,
      chat,
      askSydney(prompt, chat.id._serialized)
    );
    const hasSources = details.sourceAttributions.length >= 1;
    const sources = hasSources ? appendSources(details.sourceAttributions) : "";

    await react(message, "done");
    const reply = await message.reply(response + sources);

    if (chat.isGroup)
      await updateConversationsCache(chat.id._serialized, reply.id._serialized);
  } catch (e) {
    await react(message, "error");
    const error = serializeError(e);
    const errorMessage = error.message?.split("\n")[0];

    console.log({ error });
    await message.reply(`Error:\n\n${errorMessage}`);
  }

  chat.clearState();
}

async function askSydney(prompt: string, chatId: string) {
  let options: IOptions = {
    toneStyle: config.toneStyle,
    jailbreakConversationId: chatId,
    onProgress: (token: string) => {
      process.stdout.write(token);
    }
  };

  const onGoingConversation = await sydney.conversationsCache.get(chatId);

  if (onGoingConversation) {
    const [{ parentMessageId }] = onGoingConversation.messages.slice(-1);
    options.parentMessageId = parentMessageId;
  }

  const response: SydneyResponse = await sydney.sendMessage(prompt, options);
  //console.dir(response, { depth: null });
  return response;
}
