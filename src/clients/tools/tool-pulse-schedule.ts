// src/clients/tools/tool-schedule-heartbeat.ts

import { StructuredTool } from "langchain/tools";
import schedule from "node-schedule";
import { z } from "zod";
import { BOT_PREFIX } from "../../constants";
import { pulse } from "../../handlers/pulse";
import { WASocket } from "@whiskeysockets/baileys";
import { sock } from "../new-whatsapp";

const ScheduleHeartbeatSchema = z.object({
  chatId: z
    .string()
    .describe("The chat ID to which the heartbeat will be sent."),
  delayInMinutes: z
    .number()
    .describe("The delay in minutes after which the heartbeat will be sent."),
});

export class ScheduleHeartbeatTool extends StructuredTool {
  name = "ScheduleHeartbeatTool";
  description = "Schedules a one-time heartbeat for the LLM after a delay.";
  schema = ScheduleHeartbeatSchema;

  constructor() {
    super();
  }

  async _call({
    chatId,
    delayInMinutes,
  }: z.infer<typeof ScheduleHeartbeatSchema>): Promise<string> {
    const messageBody = `SYSTEM: This is a pulse, remember to return 'false' if there is nothing important to say. Server time (and presumably the user's time) is ${new Date().toLocaleString()}`;
    try {
      const triggerTime = new Date(Date.now() + delayInMinutes * 60000);
      schedule.scheduleJob(triggerTime, async () => {
        await pulse(chatId, messageBody, sock);
        await sock.sendMessage(chatId, { text: messageBody });
      });
      await sock.sendMessage(chatId, {
        text: `*${BOT_PREFIX}:* One-time heartbeat scheduled at ${triggerTime.toLocaleString()}`,
      });
      return `One-time heartbeat scheduled for chat: ${chatId} at ${triggerTime}`;
    } catch (error) {
      console.error("Error scheduling one-time heartbeat:", error);
      throw error;
    }
  }
}
