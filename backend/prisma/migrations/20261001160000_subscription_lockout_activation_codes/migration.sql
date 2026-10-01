-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscriptionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "lastActivatedAt" TIMESTAMP(3);

-- Initialize existing organizations to expire 30 days from creation (or from now if past)
UPDATE "organizations"
SET "subscriptionExpiresAt" = CASE
  WHEN "createdAt" + INTERVAL '30 days' > CURRENT_TIMESTAMP THEN "createdAt" + INTERVAL '30 days'
  ELSE CURRENT_TIMESTAMP + INTERVAL '30 days'
END
WHERE "subscriptionExpiresAt" IS NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "activation_codes" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedByAdminId" TEXT,
    "usedByAdminIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activation_codes_orgId_code_idx" ON "activation_codes"("orgId", "code");
CREATE INDEX IF NOT EXISTS "activation_codes_code_idx" ON "activation_codes"("code");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'activation_codes_orgId_fkey'
    ) THEN
        ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
