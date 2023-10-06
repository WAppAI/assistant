import { stripIndents } from "common-tags";
import { BOT_PREFIX, CMD_PREFIX } from "../constants";

export const helpStatement = stripIndents`Run *_${CMD_PREFIX}help_* to see the available commands.`;

export function invalidArgumentMessage(args: string, usage?: string) {
  return stripIndents`${BOT_PREFIX}Invalid argument _"${args}"_

  ${usage ? `Usage: *_${CMD_PREFIX}${usage}_*\n` : ""}
  ${helpStatement}
  `;
}

export function unauthorizedCommandFor(command: string) {
  return stripIndents`
${BOT_PREFIX}Unauthorized: You are not an admin in this group.

Only admins can run the *${command}* command

${helpStatement}`;
}
