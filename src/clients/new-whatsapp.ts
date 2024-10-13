import { Boom } from "@hapi/boom";
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
  WASocket,
  type proto,
} from "@whiskeysockets/baileys";
import { CMD_PREFIX } from "../constants";
import { handleCommand } from "../handlers/command";
import { handleMessage } from "../handlers/message";
import {
  shouldIgnore,
  shouldIgnoreUnread,
  shouldReply,
} from "../helpers/message";

const messageQueue: { [key: string]: proto.IWebMessageInfo[] } = {};
let isProcessingMessage = false;

async function processMessageQueue(chatId: string, sock: WASocket) {
  isProcessingMessage = true;

  while (messageQueue[chatId] && messageQueue[chatId].length > 0) {
    const message = messageQueue[chatId].shift();
    if (message) {
      await handleMessageWithQueue(message, sock);
    }
  }

  isProcessingMessage = false;
}

async function handleMessageWithQueue(
  message: proto.IWebMessageInfo,
  sock: WASocket
) {
  const chatId = message.key.remoteJid!;
  console.log(
    "Handling message, content:",
    message.message?.extendedTextMessage?.text
  );
  const isCommand =
    message.message?.extendedTextMessage?.text?.startsWith(CMD_PREFIX);
  if (isCommand) {
    await handleCommand(sock, message);
  } else {
    await handleMessage(sock, message);
  }
}

const { state, saveCreds } = await useMultiFileAuthState("wa_auth");
const { version, isLatest } = await fetchLatestBaileysVersion();
console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

export const sock: WASocket = makeWASocket({
  version,
  printQRInTerminal: true,
  auth: state,
  generateHighQualityLinkPreview: true,
});

const unreadCounts: { [key: string]: number } = {};

sock.ev.process(async (events) => {
  if (events["connection.update"]) {
    const update = events["connection.update"];
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      if (
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        // You might want to handle reconnection here
        console.log("Connection closed. Attempting to reconnect...");
      } else {
        console.log("Connection closed. You are logged out.");
      }
    }

    console.log("connection update", update);
  }

  if (events["chats.update"]) {
    for (const chat of events["chats.update"]) {
      if (chat.id && chat.unreadCount !== undefined) {
        if (chat.unreadCount !== null) {
          unreadCounts[chat.id] = chat.unreadCount;
        }
      }
    }
  }

  if (events["messages.upsert"]) {
    const upsert = events["messages.upsert"];
    //console.log("recv messages ", JSON.stringify(upsert, undefined, 2));

    if (upsert.type === "notify") {
      for (const message of upsert.messages) {
        console.log("notify message", message);
        const chatId = message.key.remoteJid!;
        const unreadCount = unreadCounts[chatId] || 0;

        if (await shouldIgnore(message, sock)) continue;
        if (!(await shouldReply(message, sock))) continue;
        if (await shouldIgnoreUnread(message, sock, unreadCount)) continue;

        // Add the message to the queue
        if (!messageQueue[chatId]) {
          messageQueue[chatId] = [];
        }
        messageQueue[chatId].push(message);

        // Process the queue if not already processing
        if (!isProcessingMessage) {
          await processMessageQueue(chatId, sock);
        }
      }
    }
  }

  // Don't forget to save credentials whenever they are updated
  if (events["creds.update"]) {
    await saveCreds();
  }
});
