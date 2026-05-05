-- AlterTable
ALTER TABLE "Factuur" ADD COLUMN "reistijdBedragExcl" REAL;
ALTER TABLE "Factuur" ADD COLUMN "reistijdBtwBedrag" REAL;
ALTER TABLE "Factuur" ADD COLUMN "reistijdBtwPercentage" REAL;
ALTER TABLE "Factuur" ADD COLUMN "reistijdBtwTariefId" INTEGER;
ALTER TABLE "Factuur" ADD COLUMN "reistijdKm" REAL;
ALTER TABLE "Factuur" ADD COLUMN "reistijdOmschrijving" TEXT;
ALTER TABLE "Factuur" ADD COLUMN "reistijdUren" REAL;
