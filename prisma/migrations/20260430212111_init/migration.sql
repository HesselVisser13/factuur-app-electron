-- CreateTable
CREATE TABLE "BtwTarief" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "naam" TEXT NOT NULL,
    "percentage" REAL NOT NULL,
    "geldigVanaf" DATETIME NOT NULL,
    "geldigTot" DATETIME,
    "bron" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BtwSyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bron" TEXT NOT NULL,
    "succes" BOOLEAN NOT NULL,
    "melding" TEXT NOT NULL,
    "ruweData" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Transactie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "omschrijving" TEXT NOT NULL,
    "bedrag" REAL NOT NULL,
    "invoerwijze" TEXT NOT NULL,
    "btwTariefId" INTEGER NOT NULL,
    "btwPercentage" REAL NOT NULL,
    "bedragExcl" REAL NOT NULL,
    "btwBedrag" REAL NOT NULL,
    "bedragIncl" REAL NOT NULL,
    "datum" DATETIME NOT NULL,
    "categorie" TEXT,
    "notitie" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transactie_btwTariefId_fkey" FOREIGN KEY ("btwTariefId") REFERENCES "BtwTarief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factuur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factuurNummer" TEXT NOT NULL,
    "klantNaam" TEXT NOT NULL,
    "klantAdres" TEXT,
    "datum" DATETIME NOT NULL,
    "vervalDatum" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "opmerkingen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FactuurRegel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factuurId" INTEGER NOT NULL,
    "omschrijving" TEXT NOT NULL,
    "aantal" REAL NOT NULL,
    "prijsPerStuk" REAL NOT NULL,
    "btwTariefId" INTEGER NOT NULL,
    "btwPercentage" REAL NOT NULL,
    "bedragExcl" REAL NOT NULL,
    "btwBedrag" REAL NOT NULL,
    "bedragIncl" REAL NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FactuurRegel_factuurId_fkey" FOREIGN KEY ("factuurId") REFERENCES "Factuur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FactuurRegel_btwTariefId_fkey" FOREIGN KEY ("btwTariefId") REFERENCES "BtwTarief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instelling" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Factuur_factuurNummer_key" ON "Factuur"("factuurNummer");

-- CreateIndex
CREATE UNIQUE INDEX "Instelling_key_key" ON "Instelling"("key");
