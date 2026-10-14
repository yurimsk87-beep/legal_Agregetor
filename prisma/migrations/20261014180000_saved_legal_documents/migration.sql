-- Opt-in encrypted document archive. No unencrypted title, answers or draft text.
CREATE TABLE "SavedLegalDocument" (
  "versionId" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "encryptedPayload" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedLegalDocument_pkey" PRIMARY KEY ("versionId")
);

CREATE INDEX "SavedLegalDocument_userId_createdAt_idx" ON "SavedLegalDocument"("userId", "createdAt" DESC);
ALTER TABLE "SavedLegalDocument"
  ADD CONSTRAINT "SavedLegalDocument_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
