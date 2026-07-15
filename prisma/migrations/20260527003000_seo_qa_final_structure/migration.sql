DO $$ BEGIN
  CREATE TYPE "LawyerProfileStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'MODERATION', 'PUBLISHED', 'REJECTED', 'DUPLICATE', 'SPAM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnswerStatus" AS ENUM ('DRAFT', 'MODERATION', 'PUBLISHED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnswerAuthorType" AS ENUM ('LAWYER', 'ADMIN_ASSISTED', 'EDITORIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportTargetType" AS ENUM ('QUESTION', 'ANSWER', 'LAWYER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CITY_SELECTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CITY_AUTODETECTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'QUESTION_FORM_OPENED_PUBLIC';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'QUESTION_PUBLISHED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'QUESTION_PAGE_VIEW';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'ANSWER_READ';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'LAWYER_PROFILE_OPENED_FROM_ANSWER';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'SIMILAR_QUESTION_CLICKED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'SERVICE_CATEGORY_CLICKED_FROM_QUESTION';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'BLOG_ARTICLE_READ';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'DOCUMENT_PAGE_VIEW';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CALCULATOR_USED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CALCULATOR_RESULT_VIEWED';

ALTER TABLE "Lawyer" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Lawyer" ADD COLUMN IF NOT EXISTS "blocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Lawyer" ADD COLUMN IF NOT EXISTS "profileStatus" "LawyerProfileStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Lawyer" ADD COLUMN IF NOT EXISTS "consentToNotifications" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Lawyer"
SET "profileStatus" = CASE
  WHEN "isVerified" = true THEN 'APPROVED'::"LawyerProfileStatus"
  ELSE "profileStatus"
END;

ALTER TABLE "LawyerProfile" ADD COLUMN IF NOT EXISTS "consentToAdminAssistedAnswers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LawyerProfile" ADD COLUMN IF NOT EXISTS "adminAssistedConsentAt" TIMESTAMP(3);
ALTER TABLE "LawyerProfile" ADD COLUMN IF NOT EXISTS "adminAssistedConsentComment" TEXT;

ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "moderationComment" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "sourcePage" TEXT;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "hasAttachments" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

UPDATE "Question"
SET
  "status" = CASE
    WHEN "qualityStatus" = 'APPROVED' AND "isIndexable" = true THEN 'PUBLISHED'::"QuestionStatus"
    WHEN "qualityStatus" = 'DUPLICATE' THEN 'DUPLICATE'::"QuestionStatus"
    WHEN "qualityStatus" = 'SPAM' THEN 'SPAM'::"QuestionStatus"
    WHEN "qualityStatus" = 'LOW_QUALITY' THEN 'REJECTED'::"QuestionStatus"
    ELSE 'MODERATION'::"QuestionStatus"
  END,
  "trustScore" = CASE
    WHEN "qualityStatus" = 'APPROVED' AND "isIndexable" = true THEN 85
    ELSE "trustScore"
  END,
  "publishedAt" = CASE
    WHEN "qualityStatus" = 'APPROVED' AND "isIndexable" = true THEN COALESCE("publishedAt", "createdAt")
    ELSE "publishedAt"
  END;

ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "authorType" "AnswerAuthorType" NOT NULL DEFAULT 'LAWYER';
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "publishedByUserId" TEXT;
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "publishedByAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "status" "AnswerStatus" NOT NULL DEFAULT 'MODERATION';
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "containsContactAttempt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "moderationComment" TEXT;
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "Answer" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Answer"
SET
  "status" = CASE
    WHEN "isModerated" = true AND "qualityStatus" = 'APPROVED' THEN 'PUBLISHED'::"AnswerStatus"
    WHEN "qualityStatus" IN ('LOW_QUALITY', 'SPAM', 'LEGAL_RISK') THEN 'REJECTED'::"AnswerStatus"
    ELSE 'MODERATION'::"AnswerStatus"
  END,
  "publishedAt" = CASE
    WHEN "isModerated" = true AND "qualityStatus" = 'APPROVED' THEN COALESCE("publishedAt", "createdAt")
    ELSE "publishedAt"
  END;

ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "relevanceToQuestion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "lengthScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "structureScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "uniquenessScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "noContactScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "legalCautionScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "readabilityScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AnswerQualityScore" ADD COLUMN IF NOT EXISTS "authorTrustScore" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "QuestionAttachment" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AnswerAuditLog" (
  "id" TEXT NOT NULL,
  "answerId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT,
  "oldStatus" "AnswerStatus",
  "newStatus" "AnswerStatus",
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnswerAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ContentReport" (
  "id" TEXT NOT NULL,
  "targetType" "ReportTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "questionId" TEXT,
  "answerId" TEXT,
  "lawyerId" TEXT,
  "reason" TEXT NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
  "adminComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuestionTrustScore" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "hasApprovedLawyerAnswer" BOOLEAN NOT NULL DEFAULT false,
  "hasUniqueAnswer" BOOLEAN NOT NULL DEFAULT false,
  "noPersonalData" BOOLEAN NOT NULL DEFAULT false,
  "noContactLeak" BOOLEAN NOT NULL DEFAULT false,
  "hasGoodStructure" BOOLEAN NOT NULL DEFAULT false,
  "hasSimilarQuestions" BOOLEAN NOT NULL DEFAULT false,
  "hasInternalLinks" BOOLEAN NOT NULL DEFAULT false,
  "hasNoComplaints" BOOLEAN NOT NULL DEFAULT false,
  "authorTrustScore" INTEGER NOT NULL DEFAULT 0,
  "userEngagementScore" INTEGER NOT NULL DEFAULT 0,
  "totalScore" INTEGER NOT NULL DEFAULT 0,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionTrustScore_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "QuestionAttachment" ADD CONSTRAINT "QuestionAttachment_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AnswerAuditLog" ADD CONSTRAINT "AnswerAuditLog_answerId_fkey"
  FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_answerId_fkey"
  FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "QuestionTrustScore" ADD CONSTRAINT "QuestionTrustScore_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Lawyer_active_blocked_profileStatus_idx" ON "Lawyer"("active", "blocked", "profileStatus");
CREATE INDEX IF NOT EXISTS "Question_status_qualityStatus_createdAt_idx" ON "Question"("status", "qualityStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Question_isIndexable_trustScore_idx" ON "Question"("isIndexable", "trustScore");
CREATE INDEX IF NOT EXISTS "Answer_status_qualityStatus_createdAt_idx" ON "Answer"("status", "qualityStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "Answer_containsContactAttempt_idx" ON "Answer"("containsContactAttempt");
CREATE INDEX IF NOT EXISTS "QuestionAttachment_questionId_idx" ON "QuestionAttachment"("questionId");
CREATE INDEX IF NOT EXISTS "AnswerAuditLog_answerId_createdAt_idx" ON "AnswerAuditLog"("answerId", "createdAt");
CREATE INDEX IF NOT EXISTS "AnswerAuditLog_actorUserId_idx" ON "AnswerAuditLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "ContentReport_targetType_targetId_idx" ON "ContentReport"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "QuestionTrustScore_questionId_checkedAt_idx" ON "QuestionTrustScore"("questionId", "checkedAt");
CREATE INDEX IF NOT EXISTS "QuestionTrustScore_totalScore_idx" ON "QuestionTrustScore"("totalScore");
