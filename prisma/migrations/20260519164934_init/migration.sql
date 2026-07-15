-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'LAWYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LawyerStatus" AS ENUM ('LAWYER', 'ADVOCATE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ASSIGNED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "DesiredFormat" AS ENUM ('ONLINE', 'PHONE', 'OFFICE', 'COURT');

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('PENDING', 'APPROVED', 'LOW_QUALITY', 'DUPLICATE', 'PERSONAL_DATA', 'SPAM', 'LEGAL_RISK');

-- CreateEnum
CREATE TYPE "FaqEntityType" AS ENUM ('CITY', 'SERVICE', 'CITY_SERVICE', 'LAWYER', 'ARTICLE', 'QUESTION', 'DOCUMENT', 'CALCULATOR', 'GENERAL');

-- CreateEnum
CREATE TYPE "SeoPageType" AS ENUM ('HOME', 'CITY', 'SERVICE', 'CITY_SERVICE', 'LAWYER', 'ARTICLE', 'QUESTION', 'STATIC', 'DOCUMENT', 'CALCULATOR', 'CASE', 'SITUATION', 'COURT', 'PRICE', 'TOP', 'RATING');

-- CreateEnum
CREATE TYPE "SeoMaturityStatus" AS ENUM ('DRAFT', 'COLLECTING_DATA', 'READY_FOR_INDEX', 'INDEXED', 'NEEDS_IMPROVEMENT', 'DEINDEXED');

-- CreateEnum
CREATE TYPE "SeoMode" AS ENUM ('AUTO', 'MANUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "SearchIntentType" AS ENUM ('COMMERCIAL', 'INFORMATIONAL', 'DOCUMENT', 'QUESTION', 'CALCULATOR', 'LOCAL', 'URGENT', 'COMPARISON');

-- CreateEnum
CREATE TYPE "ContentFreshnessStatus" AS ENUM ('FRESH', 'NEEDS_REVIEW', 'OUTDATED');

-- CreateEnum
CREATE TYPE "IndexStatusType" AS ENUM ('UNKNOWN', 'SUBMITTED', 'CRAWLED', 'INDEXED', 'DISCOVERED_NOT_INDEXED', 'CRAWLED_NOT_INDEXED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "SeoMergeRedirectType" AS ENUM ('REDIRECT_301', 'GONE_410', 'NOINDEX');

-- CreateEnum
CREATE TYPE "PotentialSeoPageStatus" AS ENUM ('IDEA', 'IN_PROGRESS', 'READY', 'INDEXABLE', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('PASSPORT', 'DIPLOMA', 'ADVOCATE_STATUS', 'EXPERIENCE', 'CONTACTS');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lawyer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "slug" TEXT NOT NULL,
    "photoUrl" TEXT,
    "status" "LawyerStatus" NOT NULL DEFAULT 'LAWYER',
    "experienceYears" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "education" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "consultationPrice" INTEGER,
    "primaryServiceId" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "telegram" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lawyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerProfile" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "courtExperience" TEXT,
    "officeAddress" TEXT,
    "casesCount" INTEGER NOT NULL DEFAULT 0,
    "responseTimeMinutes" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticeArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "fullDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "practiceAreaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerService" (
    "lawyerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "proofLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawyerService_pkey" PRIMARY KEY ("lawyerId","serviceId")
);

-- CreateTable
CREATE TABLE "LawyerCity" (
    "lawyerId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "officeAddress" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawyerCity_pkey" PRIMARY KEY ("lawyerId","cityId")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "serviceId" TEXT,
    "cityId" TEXT,
    "userName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'PENDING',
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "cityId" TEXT,
    "serviceId" TEXT,
    "userName" TEXT NOT NULL,
    "summary" TEXT,
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'PENDING',
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'PENDING',
    "answerQualityScore" INTEGER NOT NULL DEFAULT 0,
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "shortAnswer" TEXT,
    "importantPoints" JSONB,
    "steps" JSONB,
    "documents" JSONB,
    "deadlines" JSONB,
    "prices" JSONB,
    "risks" JSONB,
    "mistakes" JSONB,
    "serviceId" TEXT NOT NULL,
    "cityId" TEXT,
    "authorId" TEXT NOT NULL,
    "reviewedByLawyerId" TEXT,
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "contentFreshness" "ContentFreshnessStatus" NOT NULL DEFAULT 'FRESH',
    "publishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "cityId" TEXT,
    "serviceId" TEXT,
    "lawyerId" TEXT,
    "message" TEXT NOT NULL,
    "desiredFormat" "DesiredFormat",
    "sourcePage" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "entityType" "FaqEntityType" NOT NULL,
    "entityId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoPage" (
    "id" TEXT NOT NULL,
    "type" "SeoPageType" NOT NULL,
    "slug" TEXT NOT NULL,
    "cityId" TEXT,
    "serviceId" TEXT,
    "lawyerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "h1" TEXT NOT NULL,
    "seoText" TEXT NOT NULL,
    "canonical" TEXT NOT NULL,
    "robots" TEXT NOT NULL DEFAULT 'index, follow',
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "seoMaturity" "SeoMaturityStatus" NOT NULL DEFAULT 'DRAFT',
    "primaryKeyword" TEXT,
    "autoGeneratedTitle" TEXT,
    "manualTitle" TEXT,
    "autoGeneratedDescription" TEXT,
    "manualDescription" TEXT,
    "seoMode" "SeoMode" NOT NULL DEFAULT 'AUTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingRule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceId" TEXT,
    "content" TEXT NOT NULL,
    "structure" JSONB,
    "commonMistakes" JSONB,
    "priceFrom" INTEGER,
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "seoMaturity" "SeoMaturityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priceFrom" INTEGER NOT NULL,
    "priceTo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchIntent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SearchIntentType" NOT NULL,
    "serviceId" TEXT,
    "cityId" TEXT,
    "primaryKeyword" TEXT NOT NULL,
    "secondaryKeywords" TEXT[],
    "recommendedPageType" "SeoPageType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SearchIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordDemand" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "monthlySearches" INTEGER NOT NULL,
    "competitionLevel" INTEGER NOT NULL,
    "intentType" "SearchIntentType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordTarget" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "primaryPageId" TEXT NOT NULL,
    "secondaryPageIds" TEXT[],
    "intentType" "SearchIntentType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KeywordTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoScore" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "hasTitle" BOOLEAN NOT NULL DEFAULT false,
    "hasDescription" BOOLEAN NOT NULL DEFAULT false,
    "hasH1" BOOLEAN NOT NULL DEFAULT false,
    "hasSeoText" BOOLEAN NOT NULL DEFAULT false,
    "hasFaq" BOOLEAN NOT NULL DEFAULT false,
    "hasLawyers" BOOLEAN NOT NULL DEFAULT false,
    "hasPrices" BOOLEAN NOT NULL DEFAULT false,
    "hasLinks" BOOLEAN NOT NULL DEFAULT false,
    "hasJsonLd" BOOLEAN NOT NULL DEFAULT false,
    "hasCta" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoRevision" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldTitle" TEXT,
    "newTitle" TEXT,
    "oldDescription" TEXT,
    "newDescription" TEXT,
    "oldH1" TEXT,
    "newH1" TEXT,
    "oldSeoText" TEXT,
    "newSeoText" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMaturity" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "status" "SeoMaturityStatus" NOT NULL,
    "reason" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoMaturity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalSource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "codeName" TEXT NOT NULL,
    "articleNumber" TEXT,
    "url" TEXT NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleLegalSource" (
    "articleId" TEXT NOT NULL,
    "legalSourceId" TEXT NOT NULL,

    CONSTRAINT "ArticleLegalSource_pkey" PRIMARY KEY ("articleId","legalSourceId")
);

-- CreateTable
CREATE TABLE "LawChange" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "affectedServices" TEXT[],
    "affectedArticles" TEXT[],
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFreshness" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "status" "ContentFreshnessStatus" NOT NULL,
    "reason" TEXT,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentFreshness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotVisit" (
    "id" TEXT NOT NULL,
    "botName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "userAgent" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexStatus" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "status" "IndexStatusType" NOT NULL DEFAULT 'UNKNOWN',
    "source" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMerge" (
    "id" TEXT NOT NULL,
    "oldUrl" TEXT NOT NULL,
    "newUrl" TEXT,
    "reason" TEXT NOT NULL,
    "redirectType" "SeoMergeRedirectType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoMerge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "lawyerActions" TEXT NOT NULL,
    "documentsPrepared" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "clientReview" TEXT,
    "serviceId" TEXT NOT NULL,
    "cityId" TEXT,
    "lawyerId" TEXT NOT NULL,
    "isAnonymized" BOOLEAN NOT NULL DEFAULT true,
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "seoMaturity" "SeoMaturityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculator" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "serviceId" TEXT,
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "seoMaturity" "SeoMaturityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calculator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "serviceId" TEXT,
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "seoMaturity" "SeoMaturityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "timestamps" JSONB,
    "relatedServiceId" TEXT,
    "relatedLawyerId" TEXT,
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "seoMaturity" "SeoMaturityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "deadlines" TEXT NOT NULL,
    "documents" JSONB,
    "risks" JSONB,
    "serviceId" TEXT,
    "isIndexable" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "seoMaturity" "SeoMaturityStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NextBestAction" (
    "id" TEXT NOT NULL,
    "pageType" "SeoPageType" NOT NULL,
    "serviceId" TEXT,
    "cityId" TEXT,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NextBestAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PotentialSeoPage" (
    "id" TEXT NOT NULL,
    "cityId" TEXT,
    "serviceId" TEXT,
    "intentId" TEXT,
    "estimatedDemand" INTEGER NOT NULL DEFAULT 0,
    "lawyersCount" INTEGER NOT NULL DEFAULT 0,
    "contentReady" BOOLEAN NOT NULL DEFAULT false,
    "faqReady" BOOLEAN NOT NULL DEFAULT false,
    "priceBlockReady" BOOLEAN NOT NULL DEFAULT false,
    "reviewsReady" BOOLEAN NOT NULL DEFAULT false,
    "manualAllow" BOOLEAN NOT NULL DEFAULT false,
    "status" "PotentialSeoPageStatus" NOT NULL DEFAULT 'IDEA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PotentialSeoPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerServiceRating" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "cityId" TEXT,
    "rating" DECIMAL(3,2) NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "caseCount" INTEGER NOT NULL DEFAULT 0,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerServiceRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerQualityScore" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "completeness" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "legalBasis" INTEGER NOT NULL,
    "noSpam" INTEGER NOT NULL,
    "usefulness" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerQualityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerProfileQualityScore" (
    "id" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "hasPhoto" BOOLEAN NOT NULL DEFAULT false,
    "hasDescription" BOOLEAN NOT NULL DEFAULT false,
    "hasSpecialization" BOOLEAN NOT NULL DEFAULT false,
    "hasPrice" BOOLEAN NOT NULL DEFAULT false,
    "hasReviews" BOOLEAN NOT NULL DEFAULT false,
    "hasVerification" BOOLEAN NOT NULL DEFAULT false,
    "hasContacts" BOOLEAN NOT NULL DEFAULT false,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawyerProfileQualityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorPage" (
    "id" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pageType" "SeoPageType" NOT NULL,
    "targetKeyword" TEXT NOT NULL,
    "title" TEXT,
    "h1" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "faqCount" INTEGER NOT NULL DEFAULT 0,
    "hasPrices" BOOLEAN NOT NULL DEFAULT false,
    "hasReviews" BOOLEAN NOT NULL DEFAULT false,
    "hasLawyers" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_userId_key" ON "Lawyer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lawyer_slug_key" ON "Lawyer"("slug");

-- CreateIndex
CREATE INDEX "Lawyer_slug_idx" ON "Lawyer"("slug");

-- CreateIndex
CREATE INDEX "Lawyer_isVerified_rating_idx" ON "Lawyer"("isVerified", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerProfile_lawyerId_key" ON "LawyerProfile"("lawyerId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeArea_slug_key" ON "PracticeArea"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_slug_isActive_idx" ON "City"("slug", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_slug_isActive_idx" ON "Service"("slug", "isActive");

-- CreateIndex
CREATE INDEX "Review_lawyerId_isModerated_idx" ON "Review"("lawyerId", "isModerated");

-- CreateIndex
CREATE INDEX "Review_serviceId_cityId_qualityStatus_idx" ON "Review"("serviceId", "cityId", "qualityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Question_slug_key" ON "Question"("slug");

-- CreateIndex
CREATE INDEX "Question_slug_isIndexable_idx" ON "Question"("slug", "isIndexable");

-- CreateIndex
CREATE INDEX "Question_serviceId_idx" ON "Question"("serviceId");

-- CreateIndex
CREATE INDEX "Answer_questionId_isModerated_idx" ON "Answer"("questionId", "isModerated");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_slug_isIndexable_publishedAt_idx" ON "Article"("slug", "isIndexable", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_serviceId_idx" ON "Article"("serviceId");

-- CreateIndex
CREATE INDEX "Article_contentFreshness_idx" ON "Article"("contentFreshness");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FaqItem_entityType_entityId_sortOrder_idx" ON "FaqItem"("entityType", "entityId", "sortOrder");

-- CreateIndex
CREATE INDEX "SeoPage_isIndexable_type_idx" ON "SeoPage"("isIndexable", "type");

-- CreateIndex
CREATE INDEX "SeoPage_seoScore_seoMaturity_idx" ON "SeoPage"("seoScore", "seoMaturity");

-- CreateIndex
CREATE INDEX "SeoPage_primaryKeyword_idx" ON "SeoPage"("primaryKeyword");

-- CreateIndex
CREATE UNIQUE INDEX "SeoPage_type_slug_key" ON "SeoPage"("type", "slug");

-- CreateIndex
CREATE INDEX "Verification_lawyerId_status_idx" ON "Verification"("lawyerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_slug_key" ON "DocumentTemplate"("slug");

-- CreateIndex
CREATE INDEX "PriceItem_lawyerId_serviceId_idx" ON "PriceItem"("lawyerId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchIntent_slug_key" ON "SearchIntent"("slug");

-- CreateIndex
CREATE INDEX "SearchIntent_type_priority_idx" ON "SearchIntent"("type", "priority");

-- CreateIndex
CREATE INDEX "KeywordDemand_intentType_priority_idx" ON "KeywordDemand"("intentType", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordDemand_keyword_region_key" ON "KeywordDemand"("keyword", "region");

-- CreateIndex
CREATE INDEX "KeywordTarget_intentType_priority_idx" ON "KeywordTarget"("intentType", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordTarget_keyword_key" ON "KeywordTarget"("keyword");

-- CreateIndex
CREATE INDEX "SeoScore_pageId_checkedAt_idx" ON "SeoScore"("pageId", "checkedAt");

-- CreateIndex
CREATE INDEX "SeoRevision_entityType_entityId_changedAt_idx" ON "SeoRevision"("entityType", "entityId", "changedAt");

-- CreateIndex
CREATE INDEX "SeoMaturity_pageId_status_idx" ON "SeoMaturity"("pageId", "status");

-- CreateIndex
CREATE INDEX "ContentFreshness_status_nextReviewAt_idx" ON "ContentFreshness"("status", "nextReviewAt");

-- CreateIndex
CREATE INDEX "BotVisit_botName_visitedAt_idx" ON "BotVisit"("botName", "visitedAt");

-- CreateIndex
CREATE INDEX "BotVisit_url_idx" ON "BotVisit"("url");

-- CreateIndex
CREATE INDEX "IndexStatus_pageId_status_idx" ON "IndexStatus"("pageId", "status");

-- CreateIndex
CREATE INDEX "SeoMerge_oldUrl_idx" ON "SeoMerge"("oldUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Case_slug_key" ON "Case"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Calculator_slug_key" ON "Calculator"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Checklist_slug_key" ON "Checklist"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VideoPage_slug_key" ON "VideoPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LegalScenario_slug_key" ON "LegalScenario"("slug");

-- CreateIndex
CREATE INDEX "LawyerServiceRating_serviceId_cityId_rating_idx" ON "LawyerServiceRating"("serviceId", "cityId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerServiceRating_lawyerId_serviceId_cityId_key" ON "LawyerServiceRating"("lawyerId", "serviceId", "cityId");

-- CreateIndex
CREATE INDEX "CompetitorPage_competitorName_targetKeyword_idx" ON "CompetitorPage"("competitorName", "targetKeyword");

-- AddForeignKey
ALTER TABLE "Lawyer" ADD CONSTRAINT "Lawyer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lawyer" ADD CONSTRAINT "Lawyer_primaryServiceId_fkey" FOREIGN KEY ("primaryServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerProfile" ADD CONSTRAINT "LawyerProfile_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_practiceAreaId_fkey" FOREIGN KEY ("practiceAreaId") REFERENCES "PracticeArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerService" ADD CONSTRAINT "LawyerService_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerService" ADD CONSTRAINT "LawyerService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerCity" ADD CONSTRAINT "LawyerCity_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerCity" ADD CONSTRAINT "LawyerCity_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_reviewedByLawyerId_fkey" FOREIGN KEY ("reviewedByLawyerId") REFERENCES "Lawyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoPage" ADD CONSTRAINT "SeoPage_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoPage" ADD CONSTRAINT "SeoPage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoPage" ADD CONSTRAINT "SeoPage_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceItem" ADD CONSTRAINT "PriceItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchIntent" ADD CONSTRAINT "SearchIntent_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchIntent" ADD CONSTRAINT "SearchIntent_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordTarget" ADD CONSTRAINT "KeywordTarget_primaryPageId_fkey" FOREIGN KEY ("primaryPageId") REFERENCES "SeoPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoScore" ADD CONSTRAINT "SeoScore_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SeoPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoMaturity" ADD CONSTRAINT "SeoMaturity_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SeoPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLegalSource" ADD CONSTRAINT "ArticleLegalSource_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLegalSource" ADD CONSTRAINT "ArticleLegalSource_legalSourceId_fkey" FOREIGN KEY ("legalSourceId") REFERENCES "LegalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentFreshness" ADD CONSTRAINT "ContentFreshness_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexStatus" ADD CONSTRAINT "IndexStatus_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "SeoPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calculator" ADD CONSTRAINT "Calculator_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPage" ADD CONSTRAINT "VideoPage_relatedServiceId_fkey" FOREIGN KEY ("relatedServiceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPage" ADD CONSTRAINT "VideoPage_relatedLawyerId_fkey" FOREIGN KEY ("relatedLawyerId") REFERENCES "Lawyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalScenario" ADD CONSTRAINT "LegalScenario_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NextBestAction" ADD CONSTRAINT "NextBestAction_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NextBestAction" ADD CONSTRAINT "NextBestAction_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotentialSeoPage" ADD CONSTRAINT "PotentialSeoPage_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotentialSeoPage" ADD CONSTRAINT "PotentialSeoPage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotentialSeoPage" ADD CONSTRAINT "PotentialSeoPage_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "SearchIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerServiceRating" ADD CONSTRAINT "LawyerServiceRating_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerServiceRating" ADD CONSTRAINT "LawyerServiceRating_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerServiceRating" ADD CONSTRAINT "LawyerServiceRating_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerQualityScore" ADD CONSTRAINT "AnswerQualityScore_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerQualityScore" ADD CONSTRAINT "AnswerQualityScore_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerProfileQualityScore" ADD CONSTRAINT "LawyerProfileQualityScore_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "Lawyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
