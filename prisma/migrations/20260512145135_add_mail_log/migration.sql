-- CreateTable
CREATE TABLE "MailLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factuurId" INTEGER NOT NULL,
    "verzondenOp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ontvanger" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMsg" TEXT,
    "messageId" TEXT,
    CONSTRAINT "MailLog_factuurId_fkey" FOREIGN KEY ("factuurId") REFERENCES "Factuur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MailLog_factuurId_idx" ON "MailLog"("factuurId");

-- CreateIndex
CREATE INDEX "MailLog_verzondenOp_idx" ON "MailLog"("verzondenOp");
