import { GroupChat, Message } from "whatsapp-web.js";
import { promptTracker } from "../clients/prompt";
import { sydney } from "../clients/sydney";
import { config } from "../config";
import { getAvailableTones, react } from "../utils";
import { reminders } from "./reminder";
import { loadCounterData, messageCounter } from "./requests-counter";

const AVAILABLE_TONES = getAvailableTones();

function truncateWithEllipsis(input: string, maxLength: number): string {
  if (input.length <= maxLength || maxLength < 4) {
    return input;
  }

  const halfLength = Math.floor((maxLength - 3) / 2);
  const start = input.substring(0, halfLength);
  const end = input.substring(input.length - halfLength);
  return `${start} ... ${end}`;
}

export async function handleCommand(
  message: Message,
  command: string,
  args?: string
) {
  const chat = await message.getChat();
  await chat.sendSeen();

  await react(message, "working");
  switch (command.toLowerCase()) {
    case "!ping":
      await message.reply("*pong!*");
      break;
    case "!reset":
      if (chat.isGroup) {
        const admins = (chat as GroupChat).participants.map((user) => {
          if (user.isAdmin) return user.id._serialized;
        });

        if (admins.includes(message.author)) {
          await sydney.conversationsCache.delete(chat.id._serialized);
          await message.reply("Conversation history reset.");
        } else {
          await message.reply("You are not allowed to perform this command.");
        }
        break;
      } else {
        await sydney.conversationsCache.delete(chat.id._serialized);
        await message.reply("Conversation history reset.");
        break;
      }
    case "!pending":
      const pendingPrompts = promptTracker.listPendingPrompts(chat);

      if (pendingPrompts.length === 0) {
        await message.reply("There are no pending prompts.");
        break;
      }

      const pendingTexts = pendingPrompts
        .map(
          ({ data }, number) => `--- Prompt ${number} ---\n${data.text}\n---`
        )
        .join("\n\n");
      const pendingTextsTruncated = truncateWithEllipsis(pendingTexts, 60);

      await message.reply(
        `These are the pending prompts:\n\n${pendingTextsTruncated}`
      );
      break;
    case "!tone":
      if (!args)
        await message.reply(
          `Current tone: *${config.toneStyle}*.\n\n` +
            "To set a different tone, pass it as a parameter to the *!tone* command (eg.: *!tone precise*).\n\n" +
            AVAILABLE_TONES
        );
      else {
        const tone = args.trim().toLowerCase();
        const isValidTone = config.VALID_TONES.includes(
          tone as (typeof config.VALID_TONES)[number]
        );

        if (isValidTone) {
          config.toneStyle = tone as typeof config.toneStyle;
          await message.reply(`Tone set to: *${config.toneStyle}*`);
        } else {
          await message.reply(
            `Tone *${tone}* is invalid.\n\n` + AVAILABLE_TONES
          );
        }
      }
      break;
    case "!requests":
      await loadCounterData();
      await message.reply(
        `Sydney has made approximately ${messageCounter} requests, with a limit of 300 per 24 hours.`
      );
      break;
    case "!reminders": // !r 1, 2, 5
      console.log("reminders:", reminders);
      console.log("chat.id:", chat.id);
      const filteredReminders = reminders.filter(
        (reminder) => reminder.userId.user === chat.id.user
      );

      console.log("filteredReminders:", filteredReminders);

      const formattedReminders = filteredReminders
        .map((reminder, index) => `${index + 1} - ${reminder.name}`)
        .join("\n");

      if (!args) {
        if (filteredReminders.length == 0)
          await message.reply("There are no reminders");
        else
          await message.reply(
            `To delete a reminder, you can use the command *!reminder 1* to delete a specific reminder listed as 1, or *!reminder all* to delete all reminders.\n\nCurrent reminders:\n${formattedReminders}`
          );
      } else if (args === "all") {
        console.log("Delete all");
        for (const jobData of filteredReminders) {
          jobData.job.cancel();
          const index = reminders.findIndex(
            (reminder) => reminder.userId.user === jobData.userId.user
          );
          reminders.splice(index, 1);
        }
        await message.reply("Deleted all reminders");
      } else if (parseInt(args)) {
        console.log("Delete ", args);
        let selectedOption = parseInt(args);
        if (selectedOption >= 1 && selectedOption <= filteredReminders.length) {
          let selectedOptionIndex = selectedOption - 1;
          let selectedJob = filteredReminders[selectedOptionIndex];
          selectedJob.job.cancel();

          const index = reminders.findIndex(
            (reminder) => reminder.userId.user === selectedJob.userId.user
          );
          reminders.splice(index, 1);

          await message.reply(`Remind deleted: ${selectedJob.name} `);
        } else {
          await message.reply("Invalid option. Please try again.");
        }
      }
      break;

    case "!help":
      // this help message was generated by Sydney
      await message.reply(
        "These are the available commands:\n\n" +
          "👉 *!help* shows you this awesome help message.\n" +
          "👉 *!ping* tells you if I'm still alive with a *pong!*; this should be super fast.\n" +
          "👉 *!tone _args_?* lets you check or change my tone if you pass *_args_*; if you don't pass *_args_*, i will answer with the current tone and the available options. \n" +
          "👉 *!requests* estimates the remaining requests to the bingAI API (300/24h).\n" +
          "👉 *!reminders* shows current reminders and delete reminders that you don't want anymore.\n" +
          "👉 *!pending* gives you a list of the not yet answered prompts you have in this chat.\n" +
          "👉 *!reset* erases our conversation history. In group chats, *only admins* can perform this command."
      );
      break;
    default:
      await message.reply(`Command *${command}* unknown.`);
      break;
  }

  await react(message, "done");
}
