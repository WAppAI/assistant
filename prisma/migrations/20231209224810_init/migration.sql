/*
  Warnings:

  - You are about to drop the `cache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `id` on the `BingConversation` table. All the data in the column will be lost.
  - You are about to drop the column `jailbroken` on the `WAChat` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "cache";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "OpenRouterConversation" (
    "waChatId" TEXT NOT NULL PRIMARY KEY,
    "memory" TEXT NOT NULL,
    CONSTRAINT "OpenRouterConversation_waChatId_fkey" FOREIGN KEY ("waChatId") REFERENCES "WAChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cache" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BingConversation" (
    "waChatId" TEXT NOT NULL PRIMARY KEY,
    "waMessageId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "jailbreakId" TEXT,
    "jailbroken" BOOLEAN NOT NULL DEFAULT true,
    "parentMessageId" TEXT,
    "invocationId" INTEGER NOT NULL,
    "encryptedSignature" TEXT NOT NULL,
    "expiryTime" TEXT NOT NULL,
    CONSTRAINT "BingConversation_waChatId_fkey" FOREIGN KEY ("waChatId") REFERENCES "WAChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BingConversation" ("clientId", "encryptedSignature", "expiryTime", "invocationId", "jailbreakId", "parentMessageId", "waChatId", "waMessageId") SELECT "clientId", "encryptedSignature", "expiryTime", "invocationId", "jailbreakId", "parentMessageId", "waChatId", "waMessageId" FROM "BingConversation";
DROP TABLE "BingConversation";
ALTER TABLE "new_BingConversation" RENAME TO "BingConversation";
CREATE TABLE "new_WAChat" (
    "id" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_WAChat" ("id") SELECT "id" FROM "WAChat";
DROP TABLE "WAChat";
ALTER TABLE "new_WAChat" RENAME TO "WAChat";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
