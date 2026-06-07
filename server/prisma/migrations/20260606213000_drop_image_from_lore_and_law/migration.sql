-- Revert imagery from LoreEntry and ImmutableLaw. We keep the columns on
-- WorldSystem because those entities still carry imagery. SQLite's
-- ALTER TABLE … DROP COLUMN is supported on 3.35+ (Prisma's bundled
-- engine is well past that), so we can drop in place without rebuilding
-- the table.

ALTER TABLE "LoreEntry" DROP COLUMN "imageUrl";
ALTER TABLE "LoreEntry" DROP COLUMN "imageStyle";

ALTER TABLE "ImmutableLaw" DROP COLUMN "imageUrl";
ALTER TABLE "ImmutableLaw" DROP COLUMN "imageStyle";
