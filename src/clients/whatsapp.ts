import qrcode from "qrcode";
import WAWebJS, { GroupChat, Message } from "whatsapp-web.js";
import { handleMessage } from "../handlers/message";
import { handleSelfMessage } from "../handlers/message/self";
import { ALLOWED_USERS, BLOCKED_USERS, BOT_PREFIX, CMD_PREFIX } from "../constants";
import { handleCommand } from "../handlers/command";
import { shouldIgnore } from "../helpers/message";
import { prisma } from "./prisma";

// Doing this for now because ts-node complains about commonjs modules, will fix later
const { Client, LocalAuth } = WAWebJS;

export const whatsapp = new Client({
  authStrategy: new LocalAuth(),

  puppeteer: {
    handleSIGTERM: false,
    handleSIGINT: false,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--no-default-browser-check",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
});

whatsapp.on("qr", async (qr) => {
  const code = await qrcode.toString(qr, { type: "terminal", small: true });
  console.log(code);
});

whatsapp.on("loading_screen", (percent) => {
  console.log(`Loading WhatsApp Web... ${percent}%`);
});

whatsapp.on("authenticated", () => {
  console.log("Authenticated");
});

whatsapp.on("auth_failure", (message) => {
  console.log("Authentication failure. Message:", message);
});

whatsapp.on("ready", async () => {
  console.log("WhatsApp Web ready");
});

whatsapp.on("group_join", async (notification) => {
  const adder = await whatsapp.getContactById(notification.author);

  if (!ALLOWED_USERS.includes(adder.number) || BLOCKED_USERS.includes(adder.number)) {
    const groupChat = (await notification.getChat()) as GroupChat;
    console.warn(
      `User "${adder.pushname}" <${adder.number}> tried to add the bot to group "${groupChat.name}", but is not allowed. Leaving.`
    );

    await groupChat
      .sendMessage(`Sorry, @${adder.id.user}, you're not allowed to add me to groups. Bye!`, {
        mentions: [adder],
      })
      .then(async () => {
        await groupChat.leave();
      });
  }
});

whatsapp.on("message", async (message) => {
  if (await shouldIgnore(message)) return;

  const isCommand = message.body.startsWith(CMD_PREFIX);

  const chat = await message.getChat();
  if (chat.isGroup && !isCommand) {
    const mentions = await message.getMentions();
    const isMentioned = mentions.some((mention) => mention.id._serialized === message.to);

    const quotedMessage = await message.getQuotedMessage();
    const lastWaReply = await prisma.bingConversation.findFirst({
      where: { waChatId: chat.id._serialized },
      select: { waMessageId: true },
    });
    const isInThread = quotedMessage?.id._serialized == lastWaReply?.waMessageId;

    if (isMentioned || isInThread) {
      for (const mention of mentions) {
        message.body = message.body.replace(`@${mention.id.user}`, mention.pushname);
        console.log(`Replaced "${mention.id.user}" with "${mention.pushname}"`);
      }
    } else {
      return console.warn(
        "Group message received, but the bot was not mentioned neither its last completion was quoted in a thread. Ignoring."
      );
    }
  }

  if (isCommand) {
    return handleCommand(message);
  } else {
    return handleMessage(message);
  }
});

// TODO: may be possible to use only 'message_create' instead of 'message' and still handle self
whatsapp.on("message_create", async (message) => {
  const isSelf = message.to === message.from;
  const isBotMessage = message.body.startsWith(BOT_PREFIX);
  if (!isSelf || isBotMessage) return;
  if (await shouldIgnore(message)) return;

  const isCommand = message.body.startsWith("!");
  if (isCommand) {
    return handleCommand(message);
  } else {
    return handleSelfMessage(message);
  }
});
