import { Chat } from "whatsapp-web.js";

interface PromptData {
  text: string;
  chat: Chat;
}

class PromptTracker {
  private pendingPrompts: Map<Promise<any>, PromptData>;

  constructor() {
    this.pendingPrompts = new Map();
  }

  async track<T>(text: string, chat: Chat, prompt: Promise<T>): Promise<T> {
    this.pendingPrompts.set(prompt, { text, chat });
    try {
      const result = await prompt;
      this.pendingPrompts.delete(prompt);
      return result;
    } catch (error) {
      this.pendingPrompts.delete(prompt);
      throw error;
    }
  }

  listPendingPrompts(chat: Chat): { prompt: Promise<any>; data: PromptData }[] {
    return Array.from(this.pendingPrompts.entries())
      .map(([prompt, data]) => ({ prompt, data }))
      .filter(
        (entry) => entry.data.chat.id._serialized === chat.id._serialized
      );
  }
}

export const promptTracker = new PromptTracker();
