-- Date all Q&A questions from 2023-01-01 .. now, monotonically by publicNumber
-- (lower number = older), with arbitrary (random) gaps between consecutive dates.
-- Answers land 1..37h after their question, never in the future.
\set ON_ERROR_STOP on
BEGIN;

-- Questions: cumulative random weights ordered by publicNumber map onto the timeline.
WITH w AS (
  SELECT id, ("publicNumber")::int AS num, 0.4 + random() * 1.2 AS wt
  FROM "Question"
  WHERE "publicNumber" ~ '^[0-9]+$'
), c AS (
  SELECT id,
         sum(wt) OVER (ORDER BY num) AS cum,
         sum(wt) OVER () AS total
  FROM w
)
UPDATE "Question" q
SET "createdAt"  = '2023-01-01 00:00:00'::timestamp
                   + (now()::timestamp - '2023-01-01 00:00:00'::timestamp) * (c.cum / c.total),
    "publishedAt" = '2023-01-01 00:00:00'::timestamp
                   + (now()::timestamp - '2023-01-01 00:00:00'::timestamp) * (c.cum / c.total)
FROM c
WHERE q.id = c.id;

-- Answers: shortly after their question, capped at now.
WITH ad AS (
  SELECT a.id,
         LEAST(now()::timestamp, q."createdAt" + interval '1 hour' + random() * interval '36 hours') AS d
  FROM "Answer" a
  JOIN "Question" q ON q.id = a."questionId"
)
UPDATE "Answer" a
SET "createdAt" = ad.d, "publishedAt" = ad.d
FROM ad
WHERE a.id = ad.id;

COMMIT;
