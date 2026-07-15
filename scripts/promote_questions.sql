-- Promote imported questions to indexable so they appear in the public Q&A list.
-- Mirrors canIndexQuestionPage(): published+approved, not duplicate, no open reports,
-- title>=20, text>=120, has serviceId, has >=1 public answer, no contact leak.
\set ON_ERROR_STOP on
UPDATE "Question" q
SET "isIndexable" = true, "trustScore" = 85
WHERE q.status = 'PUBLISHED'
  AND q."qualityStatus" = 'APPROVED'
  AND q."isDuplicate" = false
  AND q."serviceId" IS NOT NULL
  AND char_length(btrim(q.title)) >= 20
  AND char_length(btrim(q.text)) >= 120
  AND (q.title || ' ' || q.text) !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
  AND (q.title || ' ' || q.text) !~ '(\+?7|8)[ \-(]*[0-9]{3}[ \-)]*[0-9]{3}[ \-]*[0-9]{2}[ \-]*[0-9]{2}'
  AND NOT EXISTS (
    SELECT 1 FROM "ContentReport" r
    WHERE r."questionId" = q.id AND r.status IN ('NEW', 'IN_REVIEW')
  )
  AND EXISTS (
    SELECT 1 FROM "Answer" a
    WHERE a."questionId" = q.id
      AND a.status = 'PUBLISHED'
      AND a."isModerated" = true
      AND a."qualityStatus" = 'APPROVED'
      AND a."containsContactAttempt" = false
      AND a."containsUnsupportedLegalClaim" = false
      AND a."containsFearPressure" = false
      AND a."containsGenericLeadBait" = false
      AND a."answerQualityScore" >= 60
      AND a.text !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
      AND NOT EXISTS (
        SELECT 1 FROM "ContentReport" rr
        WHERE rr."answerId" = a.id AND rr.status IN ('NEW', 'IN_REVIEW')
      )
  );
