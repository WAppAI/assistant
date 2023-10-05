/*
  Warnings:

  - You are about to drop the column `signature` on the `BingConversation` table. All the data in the column will be lost.
  - Added the required column `encryptedSignature` to the `BingConversation` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BingConversation" (
    "waChatId" TEXT NOT NULL PRIMARY KEY,
    "waMessageId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "jailbreakId" TEXT,
    "parentMessageId" TEXT,
    "invocationId" INTEGER NOT NULL,
    "encryptedSignature" TEXT NOT NULL,
    "expiryTime" TEXT NOT NULL,
    CONSTRAINT "BingConversation_waChatId_fkey" FOREIGN KEY ("waChatId") REFERENCES "WAChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BingConversation" ("clientId", "expiryTime", "id", "invocationId", "jailbreakId", "parentMessageId", "waChatId", "waMessageId") SELECT "clientId", "expiryTime", "id", "invocationId", "jailbreakId", "parentMessageId", "waChatId", "waMessageId" FROM "BingConversation";
DROP TABLE "BingConversation";
ALTER TABLE "new_BingConversation" RENAME TO "BingConversation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
