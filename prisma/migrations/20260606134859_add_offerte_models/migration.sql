-- CreateTable
CREATE TABLE "Offerte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerteNummer" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "OfferteRegel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerteId" INTEGER NOT NULL,
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
    CONSTRAINT "OfferteRegel_offerteId_fkey" FOREIGN KEY ("offerteId") REFERENCES "Offerte" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferteRegel_btwTariefId_fkey" FOREIGN KEY ("btwTariefId") REFERENCES "BtwTarief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Offerte_offerteNummer_key" ON "Offerte"("offerteNummer");

-- CreateIndex
CREATE UNIQUE INDEX "Offerte_factuurId_key" ON "Offerte"("factuurId");

-- CreateIndex
CREATE INDEX "Offerte_klantId_idx" ON "Offerte"("klantId");

-- CreateIndex
CREATE INDEX "Offerte_status_idx" ON "Offerte"("status");

-- CreateIndex
CREATE INDEX "Offerte_datum_idx" ON "Offerte"("datum");
