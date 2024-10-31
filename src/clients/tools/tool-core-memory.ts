// src/clients/tools/tool-core-memory.ts

import { StructuredTool } from "langchain/tools";
import { z } from "zod";
import { getCoreMemoryFor, updateCoreMemory } from "../../crud/conversation";

const AddToCoreMemorySchema = z.object({
  chat: z.string().describe("The chat ID to which the message will be added."),
  message: z
    .string()
    .describe(
      "Content to write to the memory. All unicode (including emojis) are supported."
    ),
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
      return `Error adding to core memory: ${(error as any).message}`;
    }
  }
}

const DeleteFromCoreMemorySchema = z.object({
  chat: z.string().describe("The chat ID from which the part will be deleted."),
  part: z.string().describe(`String to replace. Must be an exact match`),
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
      console.log("Part to delete:", part);
      let coreMemory = await getCoreMemoryFor(chat);
      if (!coreMemory) {
        return `No core memory found for chat: ${chat}`;
      }
      coreMemory = coreMemory.replace(part, "").trim();
      await updateCoreMemory(chat, coreMemory);
      return `Part deleted from core memory for chat: ${chat}`;
    } catch (error) {
      console.error("Error deleting from core memory:", error);
      return `Error deleting from core memory: ${(error as any).message}`;
    }
  }
}

const ReplaceInCoreMemorySchema = z.object({
  chat: z
    .string()
    .describe("The chat ID for which the core memory will be replaced."),
  oldPart: z.string().describe(`String to replace. Must be an exact match`),
  newPart: z
    .string()
    .describe(
      "Content to write to the memory. All unicode (including emojis) are supported."
    ),
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
      console.log("Part to replace:", oldPart);
      let coreMemory = await getCoreMemoryFor(chat);
      if (!coreMemory) {
        return `No core memory found for chat: ${chat}`;
      }
      coreMemory = coreMemory.replace(oldPart, newPart).trim();
      await updateCoreMemory(chat, coreMemory);
      return `Part replaced in core memory for chat: ${chat}`;
    } catch (error) {
      console.error("Error replacing in core memory:", error);
      return `Error replacing in core memory: ${(error as any).message}`;
    }
  }
}
