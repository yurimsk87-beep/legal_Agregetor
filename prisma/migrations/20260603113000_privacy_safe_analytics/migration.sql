-- Historical analytics may contain raw paths, referrers or arbitrary payload fields.
-- Retain event counts while removing details that are not required for MVP analytics.
UPDATE "AnalyticsEvent"
SET
  "url" = CASE
    WHEN "url" ~ '^/questions/[^/?#]+/?$' THEN '/questions/[questionSlug]'
    WHEN "url" ~ '^/questions/[^/?#]+/[^/?#]+/?$' THEN '/questions/[city]/[service]'
    WHEN "url" ~ '^/lawyers/[^/?#]+/?$' THEN '/lawyers/[lawyerSlug]'
    WHEN "url" ~ '^/lawyers/[^/?#]+/[^/?#]+/?$' THEN '/lawyers/[city]/[service]'
    WHEN "url" ~ '^/blog/[^/?#]+/?$' THEN '/blog/[articleSlug]'
    WHEN "url" ~ '^/documents/[^/?#]+/?$' THEN '/documents/[documentSlug]'
    WHEN "url" ~ '^/cases/[^/?#]+/?$' THEN '/cases/[caseSlug]'
    WHEN "url" ~ '^/calculators/[^/?#]+/?$' THEN '/calculators/[calculatorSlug]'
    WHEN "url" ~ '^/checklist/[^/?#]+/?$' THEN '/checklist/[checklistSlug]'
    WHEN "url" ~ '^/video/[^/?#]+/?$' THEN '/video/[videoSlug]'
    WHEN "url" = '/' THEN '/'
    WHEN "url" ~ '^/(about|answer-rules|calculators|cases|checklist|cities|contacts|documents|for-lawyers|how-we-check-lawyers|lawyers|login|personal-data-consent|privacy|question-rules|questions|rating|reestr-advokatov|review-policy|search|services|specializations|terms|top|video)/?$'
      THEN regexp_replace("url", '/+$', '')
    WHEN "url" ~ '^/[^/?#]+/?$' THEN '/[slug]'
    WHEN "url" ~ '^/[^/?#]+/[^/?#]+/?$' THEN '/[city]/[service]'
    ELSE '/[dynamic]'
  END,
  "sourcePage" = NULL,
  "payload" = NULL,
  "userAgent" = NULL,
  "ipHash" = NULL;
