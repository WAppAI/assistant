-- CreateTable
CREATE TABLE "BingConversation" (
    "waChatId" TEXT NOT NULL PRIMARY KEY,
    "waMessageId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "jailbreakId" TEXT,
    "parentMessageId" TEXT,
    "invocationId" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "expiryTime" TEXT NOT NULL
);
