-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MailLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factuurId" INTEGER,
    "offerteId" INTEGER,
    "verzondenOp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ontvanger" TEXT NOT NULL,
    "onderwerp" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMsg" TEXT,
    "messageId" TEXT,
    CONSTRAINT "MailLog_factuurId_fkey" FOREIGN KEY ("factuurId") REFERENCES "Factuur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MailLog_offerteId_fkey" FOREIGN KEY ("offerteId") REFERENCES "Offerte" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MailLog" ("body", "errorMsg", "factuurId", "id", "messageId", "onderwerp", "ontvanger", "status", "verzondenOp") SELECT "body", "errorMsg", "factuurId", "id", "messageId", "onderwerp", "ontvanger", "status", "verzondenOp" FROM "MailLog";
DROP TABLE "MailLog";
ALTER TABLE "new_MailLog" RENAME TO "MailLog";
CREATE INDEX "MailLog_factuurId_idx" ON "MailLog"("factuurId");
CREATE INDEX "MailLog_offerteId_idx" ON "MailLog"("offerteId");
CREATE INDEX "MailLog_verzondenOp_idx" ON "MailLog"("verzondenOp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
