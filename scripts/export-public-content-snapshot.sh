#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT_DIR/database/public-content-snapshot.generated.sql}"
SCHEMA_FILE="$ROOT_DIR/database/public-content-snapshot.sql"
PART_DIR="$ROOT_DIR/database/public-content-snapshot-parts"
MAX_BYTES=$((85 * 1024 * 1024))

mkdir -p "$(dirname "$OUT")"
rm -rf "$PART_DIR"

cat "$SCHEMA_FILE" > "$OUT"
cat >> "$OUT" <<'SQL'

TRUNCATE TABLE pravopoisk_public_snapshot.records;

COPY pravopoisk_public_snapshot.records (source_table, source_id, data) FROM STDIN;
SQL

QUERY=$(cat <<'SQL'
SELECT source_table, source_id, data
FROM (
  SELECT 'PracticeArea'::text AS source_table, p.id::text AS source_id, to_jsonb(p) AS data
    FROM "PracticeArea" p

  UNION ALL
  SELECT 'City', c.id::text, to_jsonb(c)
    FROM "City" c

  UNION ALL
  SELECT 'Service', s.id::text, to_jsonb(s)
    FROM "Service" s

  UNION ALL
  SELECT 'Lawyer', l.id::text,
         to_jsonb(l)
           - 'userId'
           - 'phone'
           - 'whatsapp'
           - 'telegram'
           - 'email'
           - 'consentToNotifications'
    FROM "Lawyer" l
   WHERE l.active = true
     AND l.blocked = false
     AND l."profileStatus" = 'APPROVED'

  UNION ALL
  SELECT 'LawyerProfile', lp.id::text,
         to_jsonb(lp)
           - 'consentToAdminAssistedAnswers'
           - 'adminAssistedConsentAt'
           - 'adminAssistedConsentComment'
           - 'draftData'
    FROM "LawyerProfile" lp
    JOIN "Lawyer" l ON l.id = lp."lawyerId"
   WHERE l.active = true
     AND l.blocked = false
     AND l."profileStatus" = 'APPROVED'

  UNION ALL
  SELECT 'LawyerService', ls."lawyerId" || ':' || ls."serviceId", to_jsonb(ls)
    FROM "LawyerService" ls

  UNION ALL
  SELECT 'LawyerCity', lc."lawyerId" || ':' || lc."cityId", to_jsonb(lc)
    FROM "LawyerCity" lc

  UNION ALL
  SELECT 'Review', r.id::text, to_jsonb(r)
    FROM "Review" r
   WHERE r."isModerated" = true
     AND r."qualityStatus" = 'APPROVED'

  UNION ALL
  SELECT 'Question', q.id::text,
         to_jsonb(q)
           - 'userEmail'
           - 'rawText'
           - 'facts'
           - 'missingFacts'
           - 'clarificationAnswers'
           - 'notificationsEnabled'
           - 'sourcePage'
    FROM "Question" q
   WHERE q.status = 'PUBLISHED'
     AND q."qualityStatus" = 'APPROVED'

  UNION ALL
  SELECT 'Answer', a.id::text,
         to_jsonb(a)
           - 'createdByUserId'
           - 'publishedByUserId'
           - 'moderationComment'
           - 'answerReviewReason'
    FROM "Answer" a
    JOIN "Question" q ON q.id = a."questionId"
   WHERE q.status = 'PUBLISHED'
     AND q."qualityStatus" = 'APPROVED'
     AND a.status = 'PUBLISHED'
     AND a."qualityStatus" = 'APPROVED'
     AND a."isModerated" = true
     AND a."containsContactAttempt" = false
     AND a."containsFearPressure" = false
     AND a."containsGenericLeadBait" = false

  UNION ALL
  SELECT 'QuestionTrustScore', qts.id::text, to_jsonb(qts)
    FROM "QuestionTrustScore" qts
    JOIN "Question" q ON q.id = qts."questionId"
   WHERE q.status = 'PUBLISHED'
     AND q."qualityStatus" = 'APPROVED'

  UNION ALL
  SELECT 'Article', a.id::text, to_jsonb(a)
    FROM "Article" a
   WHERE a.status IN ('APPROVED', 'OUTDATED')

  UNION ALL
  SELECT 'FaqItem', f.id::text, to_jsonb(f)
    FROM "FaqItem" f

  UNION ALL
  SELECT 'SeoPage', sp.id::text, to_jsonb(sp)
    FROM "SeoPage" sp

  UNION ALL
  SELECT 'RatingRule', rr.id::text, to_jsonb(rr)
    FROM "RatingRule" rr

  UNION ALL
  SELECT 'DocumentTemplate', d.id::text, to_jsonb(d)
    FROM "DocumentTemplate" d

  UNION ALL
  SELECT 'PriceItem', p.id::text, to_jsonb(p)
    FROM "PriceItem" p

  UNION ALL
  SELECT 'SearchIntent', s.id::text, to_jsonb(s)
    FROM "SearchIntent" s

  UNION ALL
  SELECT 'KeywordDemand', k.id::text, to_jsonb(k)
    FROM "KeywordDemand" k

  UNION ALL
  SELECT 'KeywordTarget', k.id::text, to_jsonb(k)
    FROM "KeywordTarget" k

  UNION ALL
  SELECT 'SeoScore', s.id::text, to_jsonb(s)
    FROM "SeoScore" s

  UNION ALL
  SELECT 'SeoMaturity', s.id::text, to_jsonb(s)
    FROM "SeoMaturity" s

  UNION ALL
  SELECT 'LegalSource', l.id::text, to_jsonb(l)
    FROM "LegalSource" l

  UNION ALL
  SELECT 'ArticleLegalSource', als."articleId" || ':' || als."legalSourceId", to_jsonb(als)
    FROM "ArticleLegalSource" als

  UNION ALL
  SELECT 'LawChange', l.id::text, to_jsonb(l)
    FROM "LawChange" l

  UNION ALL
  SELECT 'ContentFreshness', c.id::text, to_jsonb(c)
    FROM "ContentFreshness" c

  UNION ALL
  SELECT 'IndexStatus', i.id::text, to_jsonb(i)
    FROM "IndexStatus" i

  UNION ALL
  SELECT 'SeoMerge', s.id::text, to_jsonb(s)
    FROM "SeoMerge" s

  UNION ALL
  SELECT 'Case', c.id::text,
         to_jsonb(c) - 'clientReview'
    FROM "Case" c
   WHERE c."isAnonymized" = true

  UNION ALL
  SELECT 'Calculator', c.id::text, to_jsonb(c)
    FROM "Calculator" c

  UNION ALL
  SELECT 'Checklist', c.id::text, to_jsonb(c)
    FROM "Checklist" c

  UNION ALL
  SELECT 'VideoPage', v.id::text, to_jsonb(v)
    FROM "VideoPage" v

  UNION ALL
  SELECT 'LegalScenario', l.id::text, to_jsonb(l)
    FROM "LegalScenario" l

  UNION ALL
  SELECT 'NextBestAction', n.id::text, to_jsonb(n)
    FROM "NextBestAction" n

  UNION ALL
  SELECT 'PotentialSeoPage', p.id::text, to_jsonb(p)
    FROM "PotentialSeoPage" p

  UNION ALL
  SELECT 'LawyerServiceRating',
         lsr."lawyerId" || ':' || lsr."serviceId" || ':' || COALESCE(lsr."cityId", ''),
         to_jsonb(lsr)
    FROM "LawyerServiceRating" lsr

  UNION ALL
  SELECT 'AnswerQualityScore', aqs.id::text, to_jsonb(aqs)
    FROM "AnswerQualityScore" aqs
    JOIN "Answer" a ON a.id = aqs."answerId"
    JOIN "Question" q ON q.id = a."questionId"
   WHERE q.status = 'PUBLISHED'
     AND q."qualityStatus" = 'APPROVED'
     AND a.status = 'PUBLISHED'
     AND a."qualityStatus" = 'APPROVED'
     AND a."isModerated" = true

  UNION ALL
  SELECT 'LawyerProfileQualityScore', lpqs.id::text, to_jsonb(lpqs)
    FROM "LawyerProfileQualityScore" lpqs

  UNION ALL
  SELECT 'CompetitorPage', cp.id::text, to_jsonb(cp)
    FROM "CompetitorPage" cp
) snapshot
ORDER BY source_table, source_id
SQL
)

psql -X -qAt -v ON_ERROR_STOP=1 "$DATABASE_URL" \
  -c "COPY ($QUERY) TO STDOUT" >> "$OUT"

cat >> "$OUT" <<'SQL'
\.

ANALYZE pravopoisk_public_snapshot.records;
SQL

BYTES=$(wc -c < "$OUT" | tr -d ' ')
if (( BYTES > MAX_BYTES )); then
  mkdir -p "$PART_DIR"
  split -b 85m -d -a 3 --additional-suffix=.sql "$OUT" "$PART_DIR/public-content-snapshot.part-"
  cat > "$PART_DIR/README.txt" <<EOF
The complete snapshot exceeded GitHub's practical single-file size.
Reassemble before restore:

  cat public-content-snapshot.part-*.sql > ../public-content-snapshot.reassembled.sql

Original size: $BYTES bytes
EOF
  rm -f "$OUT"
  echo "Snapshot split into SQL parts under: $PART_DIR"
else
  echo "Snapshot written to: $OUT ($BYTES bytes)"
fi

echo "Excluded by design: User, Lead, QuestionAttachment, ContentReport, AdminAuditLog,"
echo "ModerationLog, Verification, BotVisit, AnalyticsEvent, AiNavigatorEvent and private fields."
