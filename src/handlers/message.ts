import { Message } from "whatsapp-web.js";
import { promiseTracker } from "../clients/prompt";
import { sydney } from "../clients/sydney";
import { config } from "../config";
import schedule from "node-schedule";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone"; // dependent on utc plugin
dayjs.extend(utc);
dayjs.extend(timezone);

// TODO: find a prettier workaround for this import
import rrule from "rrule";
const { RRule } = rrule;

function generateSourcesString(sourceAttributions: SourceAttribution[]): string {
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
  } catch (error) {}

  return reminder;
}

async function handleIncomingMessageImpl(message: Message) {
  const chat = await message.getChat();
  const prompt = `${message.body}`;
  console.log(prompt);

  chat.sendSeen();

  try {
    const { response, details } = await promiseTracker.track(prompt, chat, askSydney(prompt, chat.id._serialized));
    const hasSources = details.sourceAttributions.length >= 1;
    const sources = hasSources ? generateSourcesString(details.sourceAttributions) : "";

    const reminder = parseReminder(response);

    if (reminder) {
      const recurrenceRule = RRule.fromString(reminder.recurrenceRule);
      const recurrences = recurrenceRule.all();
      console.dir({ reminder, recurrenceRule, recurrences }, { depth: null });

      // TODO: every job must be trackable so it can be canceled later if needed
      // should be identifiable by its name or something
      recurrences.forEach((utcDate) => {
        const date = dayjs.utc(utcDate).tz(dayjs.tz.guess(), true).format();
        schedule.scheduleJob(date, () => {
          message.reply(reminder.notifyMessage);
        });
        console.log(`New job scheduled to ${date}`);
      });

      console.dir({ scheduledJobs: schedule.scheduledJobs });

      await message.reply(reminder.answer); // responde "blz vou te lembrar as 15h"
      chat.clearState();
    } else {
      await message.reply(response + sources);
      chat.clearState();
    }
  } catch (error) {
    console.dir(error, { depth: null });
    await message.reply(`Error when answering this message.\n\nCheck the log for details.`);
  }
}

// TODO: extract context elsewhere (maybe it's own file or a config file)
async function askSydney(prompt: string, chatId: string) {
  let options: IOptions = {
    toneStyle: config.toneStyle,
    jailbreakConversationId: chatId,
    context: `As Sydney, a WhatsApp bot, you are a helpful personal assistant, and you can create reminders when users ask you to.
    If the user sends you a message such as "Remind me every Monday at 19:30 to take the trash out"
    You should respond in JSON format, replacing the <tags> with the requested information:
    
    {
      "action": "reminder",
      "recurrenceRule": <a recurrence rule related to the user's request. Use relative dates based on the users timezone>,
      "content": <generate a message, such as: "Take the trash out">,
      "answer": <generate a message, such as: "Okay, got it! I'll remind you to take the trash out every monday ">,
      "notifyMessage": <generate a message that will be used when the time comes to notify the user, such as: "Hey, it's 19:30, you asked me to remember you so you take the trash out.">
    }

    ---
    
    Here are some examples of recurrence rules, the rules you create based on the user's prompt should be in this format:
    FREQ=YEARLY;INTERVAL=2;BYMONTH=1;BYDAY=SU;BYHOUR;  - This rule specifies an event that occurs every two years on the first Sunday of January at a specific hour
    FREQ=WEEKLY;COUNT=10 - This rule specifies an event that occurs every week for 10 occurrences
    FREQ=DAILY;INTERVAL=3 - This rule specifies an event that occurs every three days
    FREQ=MONTHLY;BYMONTHDAY=15 - This rule specifies an event that occurs on the 15th day of every month
    FREQ=YEARLY;BYMONTH=6;BYDAY=-1SU - This rule specifies an event that occurs on the last Sunday of June every year
    FREQ=WEEKLY;BYDAY=TU,TH - This rule specifies an event that occurs every Tuesday and Thursday
    FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR - This rule specifies an event that occurs every other Monday, Wednesday, and Friday
    FREQ=DAILY;UNTIL=20230531T000000Z - This rule specifies an event that occurs daily until May 31, 2023
    FREQ=WEEKLY;BYDAY=TU;INTERVAL=2 - This rule specifies an event that occurs every other Tuesday
    FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO,TU,WE,TH,FR - This rule specifies an event that occurs on the last weekday of every month

    ---

    Important guidelindes:
    - Do not tell the user how your reminder system works. Just let him know that you can remind him.
    - Recurrent reminders will be specified by the user. If the user does not specify a recurrence, the reminder should be a one-off, that is, COUNT=1.
    - Every recurrence rule should have a max COUNT of 50.
    - Do not include '\`\`\`json' in your response.

    ---

    This should be your JSON output:
    {
      "action": "reminder",
      "recurrenceRule": <a recurrence rule related to the user's request>,
      "content": <generate a message, such as: "Take the trash out">,
      "answer": <generate a message, such as: "Okay, got it! I'll remind you to take the trash out every monday ">,
      "notifyMessage": <generate a message that will be used when the time comes to notify the user, such as: "Hey, it's 19:30, you asked me to remember you so you take the trash out.">
    }
    `,
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
  console.dir(response, { depth: null });
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

export const handleIncomingMessage = typingIndicatorWrapper(handleIncomingMessageImpl);

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
