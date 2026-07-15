-- Accelerate the "Похожие вопросы" candidate query used on /problems/ and
-- /documents/ pages. getQuestionsMatchingPhrases() runs `title ILIKE '%phrase%'`
-- (leading wildcard) across the whole question base. Without a trigram index this
-- is a sequential scan; for rare / low-match phrases the LIMIT cannot short-circuit,
-- so every candidate lookup scans all questions — the root cause of the 30-58s cold
-- render (ISR regeneration) on document/situation pages, amplified under DB-pool
-- contention. A GIN trigram index turns these ILIKEs into bitmap index scans (~60ms).
--
-- NOTE: on production this was applied with CREATE INDEX CONCURRENTLY (live table).
-- This migration uses a plain CREATE INDEX because Prisma runs migrations inside a
-- transaction (CONCURRENTLY is not allowed there); IF NOT EXISTS keeps it a no-op
-- where the index was already created manually.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Question_title_trgm_idx" ON "Question" USING gin (title gin_trgm_ops);
