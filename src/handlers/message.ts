import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
import utc from "dayjs/plugin/utc";
import schedule from "node-schedule";
import { Message } from "whatsapp-web.js";
import { promiseTracker } from "../clients/prompt";
import { sydney } from "../clients/sydney";
import { config } from "../config";
dayjs.extend(utc);
dayjs.extend(timezone);

// TODO: find a prettier workaround for this import
import rrule from "rrule";
const { RRule } = rrule;

function generateSourcesString(
  sourceAttributions: SourceAttribution[]
): string {
  let sourcesString = "\n\n";

  for (let i = 0; i < sourceAttributions.length; i++) {
    const attribution = sourceAttributions[i];
    sourcesString += `[${i + 1}]: ${attribution.seeMoreUrl}\n`;
  }

  return sourcesString;
}

// TODO: refactor, reminder should have a ts interface
function parseReminder(response: string) {
  let reminder = null;

  try {
    reminder = JSON.parse(response);
    if (reminder) {
      return response;
    }
  } catch (error) {
    console.log("Error in parsing, probably not a JSON, right?");
  }

  return reminder;
}

async function handleIncomingMessageImpl(message: Message) {
  const chat = await message.getChat();
  const userTime = new Date(message.timestamp * 1000);
  const prompt = `${message.body} (Timestamp:${userTime})`;
  console.log("Mensagem: ", prompt);

  chat.sendSeen();

  try {
    const { response, details } = await promiseTracker.track(
      prompt,
      chat,
      askSydney(prompt, chat.id._serialized)
    );
    const hasSources = details.sourceAttributions.length >= 1;
    const sources = hasSources
      ? generateSourcesString(details.sourceAttributions)
      : "";

    const reminder = parseReminder(response);

    if (reminder) {
      const parsedReminder = JSON.parse(response);

      const cronExpression = parsedReminder.cron;
      const job = schedule.scheduleJob(cronExpression, () => console.log(""));

      let reminderCount = 0;
      job.on("run", async () => {
        console.log("Task executed");
        await message.reply(parsedReminder.notifyMessage);

        if (typeof parsedReminder.repetitions === "number") {
          reminderCount++;
          if (parsedReminder.repetitions <= reminderCount) {
            job.cancel();
            console.log("Cancelled");
          }
        }
      });

      await message.reply(parsedReminder.answer);
      return;
    } else {
      await message.reply(response + sources);
      chat.clearState();
    }
  } catch (error) {
    console.dir(error, { depth: null });
    await message.reply(
      `Error when answering this message.\n\nCheck the log for details.`
    );
  }
}

// TODO: extract context elsewhere (maybe it's own file or a config file)
async function askSydney(prompt: string, chatId: string) {
  let options: IOptions = {
    toneStyle: config.toneStyle,
    jailbreakConversationId: chatId,
    context: `As ${process.env.BOT_NAME}, a WhatsApp bot, you are a helpful personal assistant, and you can create reminders when users ask you to.

    If the user sends you a message such as "Remind me every Monday at 19:30 to take the trash out"

    You should respond in JSON format, replacing the <tags> with the requested information:
    
    {
      "cron": "based on user request",
      "repetitions": The number of times the user wants to be reminded of the task. For example, if the user wants to be reminded every 30 seconds but only twice, the value of "repetitions" should be 2. If the number of repetitions is not mentioned, assume it to be null, indicating that the reminders should continue indefinitely until manually stopped.
      "answer": <generate a message, such as: "Okay, got it! I'll remind you to take the trash out every monday ">,
      "notifyMessage": <generate a message that will be used when the time comes to notify the user, such as: "Hey, it's 19:30, you asked me to remember you so you take the trash out.">
    }

    ---
    Important guidelindes:
    - Each message sent by the user will include a timestamp indicating the current date. It's important to note that the timestamp is a system message and doesn't imply that the user is communicating in English.
    - Do not tell the user how your reminder system works. Just let him know that you can remind him.
    - Recurrent reminders will be specified by the user. If the user does not specify a recurrence, the reminder should be a one-off, that is, repetitions = 1.
    - Do not include '\`\`\`json' in your response.
    - Please ensure that any response you provide in JSON format adheres to the proper JSON syntax.
    ---
    `,
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

// generated by GPT-4, this ensures the typing indicator will last more than 25s
function typingIndicatorWrapper(fn: (message: Message) => Promise<void>) {
  return async (message: Message) => {
    const chat = await message.getChat();
    let interval: NodeJS.Timeout = setTimeout(() => {}, 0);

    const typingIndicator = () => {
      chat.sendStateTyping();
      interval = setTimeout(typingIndicator, 25000);
    };

    typingIndicator();

    try {
      const result = await fn(message);
      clearTimeout(interval);
      return result;
    } catch (error) {
      clearTimeout(interval);
      throw error;
    }
  };
}

export const handleIncomingMessage = typingIndicatorWrapper(
  handleIncomingMessageImpl
);

interface IOptions {
  toneStyle: (typeof config.VALID_TONES)[number];
  systemMessage?: string;
  jailbreakConversationId?: string;
  parentMessageId?: string;
  context?: string;
  onProgress?: (token: string) => void;
}

// these interfaces were generated by GPT-3.5 based on an example response
interface AdaptiveCard {
  type: string;
  version: string;
  body: Array<{
    type: string;
    text: string;
    wrap?: boolean;
    size?: string;
  }>;
}

interface SourceAttribution {
  providerDisplayName: string;
  seeMoreUrl: string;
  imageLink: string;
  imageWidth: string;
  imageHeight: string;
  imageFavicon: string;
  searchQuery: string;
}

interface Feedback {
  tag: null;
  updatedOn: null;
  type: string;
}

interface SuggestedResponse {
  text: string;
  author: string;
  createdAt: string;
  timestamp: string;
  messageId: string;
  messageType: string;
  offense: string;
  feedback: Feedback;
  contentOrigin: string;
  privacy: null;
}

interface Details {
  text: string;
  author: string;
  createdAt: string;
  timestamp: string;
  messageId: string;
  requestId: string;
  offense: string;
  adaptiveCards: AdaptiveCard[];
  sourceAttributions: SourceAttribution[];
  feedback: Feedback;
  contentOrigin: string;
  privacy: null;
  suggestedResponses: SuggestedResponse[];
}

interface SydneyResponse {
  conversationId: string;
  conversationSignature: string;
  clientId: string;
  invocationId: number;
  conversationExpiryTime: string;
  response: string;
  details: Details;
  jailbreakConversationId: string;
  parentMessageId: string;
  messageId: string;
}
