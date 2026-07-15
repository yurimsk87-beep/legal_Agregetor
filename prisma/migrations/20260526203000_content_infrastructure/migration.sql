CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW_REQUIRED', 'APPROVED', 'OUTDATED');

ALTER TABLE "Article" ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "Article"
SET "status" = CASE
  WHEN "contentFreshness" = 'OUTDATED' THEN 'OUTDATED'::"ContentStatus"
  WHEN "isIndexable" = true AND "publishedAt" IS NOT NULL THEN 'APPROVED'::"ContentStatus"
  ELSE 'REVIEW_REQUIRED'::"ContentStatus"
END;

UPDATE "Article"
SET "isIndexable" = false
WHERE "status" <> 'APPROVED';

CREATE INDEX "Article_status_updatedAt_idx" ON "Article"("status", "updatedAt");
