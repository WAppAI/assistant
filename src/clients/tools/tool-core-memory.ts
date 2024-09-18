// src/clients/tools/tool-core-memory.ts

import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { getCoreMemoryFor, updateCoreMemory } from "../../crud/conversation";

const AddToCoreMemorySchema = z.object({
  chat: z.string().describe("The chat ID to which the message will be added."),
  message: z.string().describe("The message to add to the core memory."),
});

export class AddToCoreMemoryTool extends StructuredTool {
  name = "AddToCoreMemoryTool";
  description = "Adds a message to the core memory for a given chat.";
  schema = AddToCoreMemorySchema;

  async _call({
    chat,
    message,
  }: z.infer<typeof AddToCoreMemorySchema>): Promise<string> {
    try {
      let coreMemory = await getCoreMemoryFor(chat);
      if (!coreMemory) {
        coreMemory = "";
      }
      coreMemory += ` ${message}`;
      await updateCoreMemory(chat, coreMemory.trim());
      return `Message added to core memory for chat: ${chat}`;
    } catch (error) {
      console.error("Error adding to core memory:", error);
      throw error;
    }
  }
}

const DeleteFromCoreMemorySchema = z.object({
  chat: z.string().describe("The chat ID from which the part will be deleted."),
  part: z.string().describe("The specific part of the core memory to delete."),
});

export class DeleteFromCoreMemoryTool extends StructuredTool {
  name = "DeleteFromCoreMemoryTool";
  description = "Deletes a specific part of the core memory for a given chat.";
  schema = DeleteFromCoreMemorySchema;

  async _call({
    chat,
    part,
  }: z.infer<typeof DeleteFromCoreMemorySchema>): Promise<string> {
    try {
      let coreMemory = await getCoreMemoryFor(chat);
      if (!coreMemory) {
        return `No core memory found for chat: ${chat}`;
      }
      coreMemory = coreMemory.replace(part, "").trim();
      await updateCoreMemory(chat, coreMemory);
      return `Part deleted from core memory for chat: ${chat}`;
    } catch (error) {
      console.error("Error deleting from core memory:", error);
      throw error;
    }
  }
}

const ReplaceInCoreMemorySchema = z.object({
  chat: z
    .string()
    .describe("The chat ID for which the core memory will be replaced."),
  oldPart: z
    .string()
    .describe("The specific part of the core memory to replace."),
  newPart: z.string().describe("The new part to replace the old part with."),
});

export class ReplaceInCoreMemoryTool extends StructuredTool {
  name = "ReplaceInCoreMemoryTool";
  description = "Replaces a specific part of the core memory for a given chat.";
  schema = ReplaceInCoreMemorySchema;

  async _call({
    chat,
    oldPart,
    newPart,
  }: z.infer<typeof ReplaceInCoreMemorySchema>): Promise<string> {
    try {
      let coreMemory = await getCoreMemoryFor(chat);
      if (!coreMemory) {
        return `No core memory found for chat: ${chat}`;
      }
      coreMemory = coreMemory.replace(oldPart, newPart).trim();
      await updateCoreMemory(chat, coreMemory);
      return `Part replaced in core memory for chat: ${chat}`;
    } catch (error) {
      console.error("Error replacing in core memory:", error);
      throw error;
    }
  }
}
