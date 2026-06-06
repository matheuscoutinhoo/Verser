-- Rename Character.arc → Character.skills.
-- We keep the column type (TEXT, nullable) — the column now holds a
-- JSON-encoded string[] instead of a free-text arc description, but
-- existing rows stay valid because both old and new values are read as
-- TEXT. SQLite >= 3.25 supports RENAME COLUMN natively, so this is a
-- non-destructive migration.

ALTER TABLE "Character" RENAME COLUMN "arc" TO "skills";
