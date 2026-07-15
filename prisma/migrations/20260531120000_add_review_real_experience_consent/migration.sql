-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "hasRealExperienceConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "realExperienceConsentAt" TIMESTAMP(3);
