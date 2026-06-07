-- Add imageUrl + imageStyle columns to WorldSystem, LoreEntry and
-- ImmutableLaw, mirroring the shape already present on Character and
-- Location. All columns are nullable TEXT so we don't need to backfill
-- existing rows.

ALTER TABLE "WorldSystem" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "WorldSystem" ADD COLUMN "imageStyle" TEXT;

ALTER TABLE "LoreEntry" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "LoreEntry" ADD COLUMN "imageStyle" TEXT;

ALTER TABLE "ImmutableLaw" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "ImmutableLaw" ADD COLUMN "imageStyle" TEXT;
