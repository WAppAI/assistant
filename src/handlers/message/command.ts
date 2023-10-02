import { Message } from "whatsapp-web.js";
import { setStatusFor } from "../../helpers/message";
import { log } from "../../helpers/utils";
import { prisma } from "../../clients/prisma";
import { BOT_PREFIX } from "../../constants";

export async function handleCommand(message: Message) {
  const [command, ..._args] = message.body.split(" ");
  const args = _args.join(" ");
  let reply: Message;

  log(message);
  await setStatusFor(message, "working");

  switch (command) {
    case "!ping":
      reply = await message.reply(BOT_PREFIX + "pong!");
      break;
    case "!reset":
      if (args === "all") {
        await prisma.bingConversation.deleteMany();
        reply = await message.reply(BOT_PREFIX + "deleted all conversations");
      } else {
        const chat = await message.getChat();
        const exists = await prisma.bingConversation.findFirst({
          where: { waChatId: chat.id._serialized },
        });

        if (exists) {
          await prisma.bingConversation.delete({
            where: { waChatId: chat.id._serialized },
          });
          reply = await message.reply(BOT_PREFIX + "deleted this conversation");
        } else {
          reply = await message.reply(BOT_PREFIX + "no conversation to delete");
        }
      }
      break;
    default:
      reply = await message.reply(BOT_PREFIX + "unknown command");
      break;
  }

  log(reply, message.timestamp);
  await setStatusFor(message, "done");
}
