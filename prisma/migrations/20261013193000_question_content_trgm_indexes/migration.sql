-- Search by the substantive content of public questions as well as titles.
-- Query uses Prisma's case-insensitive contains (ILIKE '%term%').
-- The existing title trigram index is preserved. Apply during a maintenance window:
-- building GIN indexes on large tables can consume considerable resources.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Question_text_trgm_idx" ON "Question" USING gin (text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Question_summary_trgm_idx" ON "Question" USING gin (summary gin_trgm_ops);
