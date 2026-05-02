/*
  Warnings:

  - You are about to drop the column `klantAdres` on the `Factuur` table. All the data in the column will be lost.
  - You are about to drop the column `klantNaam` on the `Factuur` table. All the data in the column will be lost.
  - Added the required column `klantId` to the `Factuur` table without a default value. This is not possible if the table is not empty.
  - Added the required column `datum` to the `FactuurRegel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Klant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bedrijfsnaam" TEXT NOT NULL,
    "contactpersoon" TEXT,
    "adres" TEXT,
    "postcode" TEXT,
    "plaats" TEXT,
    "email" TEXT,
    "telefoon" TEXT,
    "kvkNummer" TEXT,
    "btwNummer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Factuur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factuurNummer" TEXT NOT NULL,
    "klantId" INTEGER NOT NULL,
    "datum" DATETIME NOT NULL,
    "vervalDatum" DATETIME NOT NULL,
    "referentie" TEXT,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "opmerkingen" TEXT,
    "totaalExcl" REAL NOT NULL DEFAULT 0,
    "totaalBtw" REAL NOT NULL DEFAULT 0,
    "totaalIncl" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Factuur_klantId_fkey" FOREIGN KEY ("klantId") REFERENCES "Klant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Factuur" ("createdAt", "datum", "factuurNummer", "id", "opmerkingen", "status", "updatedAt", "vervalDatum") SELECT "createdAt", "datum", "factuurNummer", "id", "opmerkingen", "status", "updatedAt", "vervalDatum" FROM "Factuur";
DROP TABLE "Factuur";
ALTER TABLE "new_Factuur" RENAME TO "Factuur";
CREATE UNIQUE INDEX "Factuur_factuurNummer_key" ON "Factuur"("factuurNummer");
CREATE TABLE "new_FactuurRegel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "factuurId" INTEGER NOT NULL,
    "datum" DATETIME NOT NULL,
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
INSERT INTO "new_FactuurRegel" ("aantal", "bedragExcl", "bedragIncl", "btwBedrag", "btwPercentage", "btwTariefId", "factuurId", "id", "omschrijving", "prijsPerStuk", "volgorde") SELECT "aantal", "bedragExcl", "bedragIncl", "btwBedrag", "btwPercentage", "btwTariefId", "factuurId", "id", "omschrijving", "prijsPerStuk", "volgorde" FROM "FactuurRegel";
DROP TABLE "FactuurRegel";
ALTER TABLE "new_FactuurRegel" RENAME TO "FactuurRegel";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
