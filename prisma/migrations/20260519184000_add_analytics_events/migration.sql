-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM (
    'LEAD_SUBMIT',
    'CALL_CLICK',
    'WHATSAPP_CLICK',
    'TELEGRAM_CLICK',
    'PHONE_VIEW',
    'QUESTION_SUBMIT',
    'CHECKLIST_DOWNLOAD',
    'DOCUMENT_ORDER',
    'CALCULATOR_RUN',
    'LAWYER_PROFILE_CLICK',
    'CTA_CLICK',
    'DOCUMENT_CHECK_FORM'
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "url" TEXT NOT NULL,
    "sourcePage" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "payload" JSONB,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_url_idx" ON "AnalyticsEvent"("url");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_targetType_targetId_idx" ON "AnalyticsEvent"("targetType", "targetId");
