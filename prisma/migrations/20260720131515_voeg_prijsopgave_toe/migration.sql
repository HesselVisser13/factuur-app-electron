-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offerte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerteNummer" TEXT NOT NULL,
    "isPrijsopgave" BOOLEAN NOT NULL DEFAULT false,
    "klantId" INTEGER NOT NULL,
    "datum" DATETIME NOT NULL,
    "geldigTot" DATETIME NOT NULL,
    "referentie" TEXT,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "opmerkingen" TEXT,
    "toonAkkoordBlok" BOOLEAN NOT NULL DEFAULT false,
    "totaalExcl" REAL NOT NULL DEFAULT 0,
    "totaalBtw" REAL NOT NULL DEFAULT 0,
    "totaalIncl" REAL NOT NULL DEFAULT 0,
    "reistijdUren" REAL,
    "reistijdKm" REAL,
    "reistijdBedragExcl" REAL,
    "reistijdBtwBedrag" REAL,
    "reistijdBtwPercentage" REAL,
    "reistijdBtwTariefId" INTEGER,
    "reistijdOmschrijving" TEXT,
    "factuurId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Offerte_klantId_fkey" FOREIGN KEY ("klantId") REFERENCES "Klant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offerte_factuurId_fkey" FOREIGN KEY ("factuurId") REFERENCES "Factuur" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Offerte" ("createdAt", "datum", "factuurId", "geldigTot", "id", "klantId", "offerteNummer", "opmerkingen", "referentie", "reistijdBedragExcl", "reistijdBtwBedrag", "reistijdBtwPercentage", "reistijdBtwTariefId", "reistijdKm", "reistijdOmschrijving", "reistijdUren", "status", "toonAkkoordBlok", "totaalBtw", "totaalExcl", "totaalIncl", "updatedAt") SELECT "createdAt", "datum", "factuurId", "geldigTot", "id", "klantId", "offerteNummer", "opmerkingen", "referentie", "reistijdBedragExcl", "reistijdBtwBedrag", "reistijdBtwPercentage", "reistijdBtwTariefId", "reistijdKm", "reistijdOmschrijving", "reistijdUren", "status", "toonAkkoordBlok", "totaalBtw", "totaalExcl", "totaalIncl", "updatedAt" FROM "Offerte";
DROP TABLE "Offerte";
ALTER TABLE "new_Offerte" RENAME TO "Offerte";
CREATE UNIQUE INDEX "Offerte_offerteNummer_key" ON "Offerte"("offerteNummer");
CREATE UNIQUE INDEX "Offerte_factuurId_key" ON "Offerte"("factuurId");
CREATE INDEX "Offerte_klantId_idx" ON "Offerte"("klantId");
CREATE INDEX "Offerte_status_idx" ON "Offerte"("status");
CREATE INDEX "Offerte_datum_idx" ON "Offerte"("datum");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
