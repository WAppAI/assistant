import { REACTIONS } from "../handlers/reactions";

export function isEmoji(str: string) {
  const regex = /[\p{Emoji}]/u;
  return regex.test(str);
}

export function checkEnv() {
  // Checks if all reactions are valid emojis
  Object.values(REACTIONS).forEach((reaction) => {
    if (!isEmoji(reaction)) {
      throw new Error(
        `Invalid emoji "${reaction}" provided for reaction. Please check your .env file.`
      );
    }
  });
}
