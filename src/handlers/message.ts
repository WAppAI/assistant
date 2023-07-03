import { serializeError } from "serialize-error";
import { Contact, Message, MessageMedia } from "whatsapp-web.js";
import { promptTracker } from "../clients/prompt";
import { sydney } from "../clients/sydney";
import { config } from "../config";
import type { IOptions, SourceAttribution, SydneyResponse } from "../types";
import { transcribeAudio } from "./audio-transcription";
import { getContext } from "./context";
import { counterRequests } from "./requests-counter";
import { jsonSafeParse, react } from "../utils";
import { scheduleReminder } from "./reminder";
import { reminderSchema } from "../schemas/reminder";

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
  botMention?: Contact
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

async function upsertLastWAreplyId(chatId: string, lastWAreplyId: string) {
  const onGoingConversation = await sydney.conversationsCache.get(chatId);
  await sydney.conversationsCache.set(chatId, {
    ...onGoingConversation,
    lastWAreplyId,
  });
}

async function handleGroupMessage(message: Message) {
  const chat = await message.getChat();

  //const mentions = await message.getMentions();       // Stoped working for some reason (I think it's because the number field is empty)
  //const botMention = mentions.filter((mention) => mention.isMe).pop();
  const quotedMessage = await message.getQuotedMessage();

  let isInThread = false;
  const OnGoingConversation = await sydney.conversationsCache.get(
    chat.id._serialized
  );
  if (OnGoingConversation)
    isInThread = quotedMessage
      ? quotedMessage.id._serialized === OnGoingConversation.lastWAreplyId
      : false;

  const mentionedIds = message.mentionedIds; // Temporary logic so that you can talk with Sydney with @Sydney in a group
  const toId = message.to;
  let isMentionedInTo = false;
  mentionedIds.forEach((mentionedId) => {
    if (mentionedId === toId) {
      isMentionedInTo = true;
    }
  });

  if (!isMentionedInTo && !isInThread) return false;

  //replaceMentions(message, mentions, botMention);

  return true;
}

async function handleAudioMessage(message: Message, media: MessageMedia) {
  if (process.env.TRANSCRIPTION_ENABLED === "true") {
    react(message, "working");
    const audioBuffer = Buffer.from(media.data, "base64");

    try {
      const transcription = await transcribeAudio(audioBuffer);
      message.body = transcription;

      if (process.env.REPLY_TRANSCRIPTION === "true")
        await message.reply(`Transcription:\n\n${transcription}`);

      return true;
    } catch (e) {
      react(message, "error");
      const error = serializeError(e);
      const errorMessage = error.message?.split("\n")[0];
      console.log({ error });

      let errorDetails = `Audio message detected but the transcription failed:\n\n${errorMessage}`;
      if (error.status === 401)
        errorDetails += "\n\nDid you set your OpenAI API key?";

      await message.reply(errorDetails);
      return false;
    }
  } else {
    react(message, "error");
    await message.reply(
      "Audio message detected but the transcription feature is currently turned off. Not replying."
    );
    return false;
  }
}

async function handleMediaMessage(message: Message) {
  const media = await message.downloadMedia();

  if (media.mimetype.startsWith("audio/")) {
    return await handleAudioMessage(message, media);
  } else {
    react(message, "error");
    message.reply(
      "Unsupported media format.\n\nCurrently, only text and audio messages are supported. Not replying."
    );
    return false;
  }
}

export async function handleMessage(message: Message) {
  let interval = setTimeout(() => {}, 0);
  const chat = await message.getChat();

  clearTimeout(interval);
  chat.clearState();

  if (chat.isGroup) {
    const shouldReply = await handleGroupMessage(message);
    if (!shouldReply) return;
  }

  await chat.sendSeen();

  if (message.hasMedia) {
    const shouldReply = await handleMediaMessage(message);
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

  async function typingIndicator() {
    await chat.sendStateTyping();
    interval = setTimeout(typingIndicator, 25000);
  }

  typingIndicator();
  await react(message, "working");

  counterRequests();

  const timestamp = new Date(message.timestamp * 1000);
  const prompt = `${timestamp}\n${message.body}`;

  try {
    const { response, details } = await promptTracker.track(
      message.body,
      chat,
      askSydney(message.body, chat.id._serialized, await getContext(message))
    );
    const hasSources = details.sourceAttributions.length >= 1;
    const sources = hasSources ? appendSources(details.sourceAttributions) : "";

    const reminder = jsonSafeParse(response, reminderSchema);
    if (reminder) {
      await scheduleReminder(reminder, message);
    }

    await react(message, "done");

    const reply = await message.reply(
      reminder ? reminder.answer : response + sources
    );

    if (chat.isGroup)
      await upsertLastWAreplyId(chat.id._serialized, reply.id._serialized);
  } catch (e) {
    await react(message, "error");
    const error = serializeError(e);
    const errorMessage = error.message?.split("\n")[0];

    console.log({ error });
    await message.reply(`Error:\n\n${errorMessage}`);
  }

  clearTimeout(interval);
  chat.clearState();
}

async function askSydney(prompt: string, chatId: string, context: string) {
  let options: IOptions = {
    toneStyle: config.toneStyle,
    jailbreakConversationId: chatId,
    context,
    onProgress: (token: string) => {
      process.stdout.write(token);
    },
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
