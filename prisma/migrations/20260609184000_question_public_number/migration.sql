ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "publicNumber" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Question_publicNumber_key" ON "Question"("publicNumber");
