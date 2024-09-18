-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OpenRouterConversation" (
    "waChatId" TEXT NOT NULL PRIMARY KEY,
    "memory" TEXT NOT NULL,
    "coreMemory" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "OpenRouterConversation_waChatId_fkey" FOREIGN KEY ("waChatId") REFERENCES "WAChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OpenRouterConversation" ("memory", "waChatId") SELECT "memory", "waChatId" FROM "OpenRouterConversation";
DROP TABLE "OpenRouterConversation";
ALTER TABLE "new_OpenRouterConversation" RENAME TO "OpenRouterConversation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
