/*
  Warnings:

  - You are about to drop the column `contactpersoon` on the `Klant` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Klant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL DEFAULT 'particulier',
    "bedrijfsnaam" TEXT,
    "aanhef" TEXT,
    "voornaam" TEXT,
    "achternaam" TEXT,
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
INSERT INTO "new_Klant" ("adres", "bedrijfsnaam", "btwNummer", "createdAt", "email", "id", "kvkNummer", "plaats", "postcode", "telefoon", "updatedAt") SELECT "adres", "bedrijfsnaam", "btwNummer", "createdAt", "email", "id", "kvkNummer", "plaats", "postcode", "telefoon", "updatedAt" FROM "Klant";
DROP TABLE "Klant";
ALTER TABLE "new_Klant" RENAME TO "Klant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
