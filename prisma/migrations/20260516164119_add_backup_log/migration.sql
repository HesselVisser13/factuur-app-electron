-- CreateTable
CREATE TABLE "BackupLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "filePath" TEXT,
    "bytes" INTEGER,
    "errorMsg" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "BackupLog_type_idx" ON "BackupLog"("type");

-- CreateIndex
CREATE INDEX "BackupLog_createdAt_idx" ON "BackupLog"("createdAt");
