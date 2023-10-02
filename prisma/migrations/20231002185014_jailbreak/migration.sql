-- CreateTable
CREATE TABLE "WAChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jailbroken" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "cache" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

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
    "signature" TEXT NOT NULL,
    "expiryTime" TEXT NOT NULL,
    CONSTRAINT "BingConversation_waChatId_fkey" FOREIGN KEY ("waChatId") REFERENCES "WAChat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BingConversation" ("clientId", "expiryTime", "id", "invocationId", "jailbreakId", "parentMessageId", "signature", "waChatId", "waMessageId") SELECT "clientId", "expiryTime", "id", "invocationId", "jailbreakId", "parentMessageId", "signature", "waChatId", "waMessageId" FROM "BingConversation";
DROP TABLE "BingConversation";
ALTER TABLE "new_BingConversation" RENAME TO "BingConversation";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
