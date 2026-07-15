-- CreateTable
CREATE TABLE "AiNavigatorEvent" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "query" TEXT,
    "page" TEXT,
    "confidence" TEXT,
    "riskLevel" TEXT,
    "urgency" TEXT,
    "targetType" TEXT,
    "targetHref" TEXT,
    "targetTitle" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiNavigatorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiNavigatorEvent_event_createdAt_idx" ON "AiNavigatorEvent"("event", "createdAt");

-- CreateIndex
CREATE INDEX "AiNavigatorEvent_createdAt_idx" ON "AiNavigatorEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AiNavigatorEvent_query_idx" ON "AiNavigatorEvent"("query");
