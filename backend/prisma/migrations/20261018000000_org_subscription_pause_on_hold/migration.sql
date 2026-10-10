-- AlterTable: Add subscription pause tracking to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscriptionPausedAt" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "subscriptionPausedRemainingSeconds" INTEGER;
