import type {
  BingAIClientResponse,
  SourceAttribution,
  SuggestedResponse,
  // @ts-ignore
} from "@waylaidwanderer/chatgpt-api";
import { proto } from "@whiskeysockets/baileys";
import { sock } from "../../clients/new-whatsapp";
import { STREAM_REMINDERS, STREAM_RESPONSES } from "../../constants";
import { generateCompletionWithBing } from "./generate-completion-with-bing";

export async function getCompletionWithBing(
  message: proto.IWebMessageInfo,
  context: string,
  streamingReply: proto.IWebMessageInfo
) {
  let streamingReplyBody = streamingReply.message?.conversation || "";
  let tokenQueue: string[] = [];
  let isProcessingQueue = false;
  let isEditingReply: Promise<proto.WebMessageInfo | null>;
  let isReminder = false;

  async function onTokenStream(token: string) {
    if (STREAM_RESPONSES !== "true") return;
    const isWebSearch =
      token.startsWith("Searching") && tokenQueue.length === 0;
    if (isWebSearch) token = ` ${token} ...\n\n`; // Formats the web search message nicely

    // Avoids reminders being shown to the user as they're being generated
    if (!isReminder) isReminder = token.startsWith("{");
    if (isReminder && STREAM_REMINDERS !== "true") return;

    tokenQueue.push(token);

    if (!isProcessingQueue) {
      isProcessingQueue = true;
      await processTokenQueue();
    }
  }

  async function processTokenQueue() {
    if (tokenQueue.length !== 0) {
      const token = tokenQueue[0];
      const newReplyContent = streamingReplyBody + token;
      isEditingReply = sock
        .sendMessage(
          message.key.remoteJid!,
          {
            text: newReplyContent,
          },
          {
            quoted: message,
          }
        )
        .then((response) => response || null);
      streamingReplyBody = newReplyContent;

      tokenQueue.shift(); // Removes the processed token from the queue

      await processTokenQueue(); // Continues processing the queue
    } else {
      isProcessingQueue = false;
    }
  }

  const completion = await generateCompletionWithBing(
    message,
    context,
    onTokenStream
  );
  completion.response = removeFootnotes(completion.response);

  // This is needed to make sure that the last edit to the reply is actually
  // the formatted completion.response, and not some random edit by the queue processing
  // ts-ignore is not ideal but it's what we've got for now
  // @ts-ignore
  return Promise.all([completion, isEditingReply]).then(
    ([completion]) => completion
  );
}

export function getSuggestions(completion: BingAIClientResponse) {
  const suggestions = completion.details.suggestedResponses;

  // All the suggested responses enumerated, eg: "Suggestions\n\n1. Suggestion 1\n2. Suggestion 2"
  const suggestionsList = suggestions.map(
    (suggestion: SuggestedResponse, i: number) => `${i + 1}. ${suggestion.text}`
  );

  return (
    (suggestionsList.length &&
      "*Suggested responses:*\n" + suggestionsList.join("\n")) ||
    ""
  );
}

export function getSources(completion: BingAIClientResponse) {
  const sources = completion.details.sourceAttributions;

  // All the sources enumerated, eg: "Sources\n\n1. Source 1\n2. Source 2"
  const sourcesList = sources.map(
    (source: SourceAttribution, i: number) => `${i + 1}. ${source.seeMoreUrl}`
  );

  return (sourcesList.length && "*Sources:*\n" + sourcesList.join("\n")) || "";
}

function removeFootnotes(text: string): string {
  // Use a regular expression to match and remove the "[^x^]" pattern, where x is a number.
  const cleanedText = text.replace(/\[\^\d+\^\]/g, "");

  return cleanedText;
}
