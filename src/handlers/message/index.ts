import dayjs from "dayjs";
import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { bing } from "../../clients/bing";
import { createContextFromMessage } from "../context";
import { whatsapp } from "../../clients/whatsapp";

async function log(message: Message, initialTimestamp?: number) {
  const chat = await message.getChat();
  const contact = await message.getContact();
  const chatName = chat.isGroup ? `@${chat.name}` : "@dm";

  const isReply = !!initialTimestamp;

  const from = contact.pushname;
  const to =
    chat.isGroup && isReply
      ? (await (await message.getQuotedMessage()).getContact()).pushname
      : (await whatsapp.getContactById(message.to)).pushname;

  const timestamp = dayjs.unix(message.timestamp);
  const timestampStr = timestamp.format("HH:mm:ss");

  const timeDelta =
    initialTimestamp &&
    timestamp.diff(dayjs.unix(initialTimestamp), "milliseconds", true);
  const timeDeltaStr = timeDelta ? `[${timeDelta}ms]` : "";

  console.log(
    `${timestampStr} [${from}->${to}${chatName}]${timeDeltaStr}: ${message.body}`
  );
}

export async function handleMessage(message: Message) {
  await log(message);
  await setStatusFor(message, "working");

  try {
    const context = await createContextFromMessage(message);
    const completion = await bing.sendMessage(message.body, {
      toneStyle: "creative",
      context,
    });

    const reply = await message.reply(completion.response);

    await log(reply, message.timestamp);
    await setStatusFor(message, "done");
  } catch (error) {
    console.error(error);

    await message.reply(`Error: ${JSON.stringify(error)}`);

    await setStatusFor(message, "error");
  }
}
