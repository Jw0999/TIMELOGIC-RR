-- AlterTable: Add plan capability limits to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "maxEmployees" INTEGER DEFAULT 20;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "maxKiosks" INTEGER DEFAULT 1;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "maxOffices" INTEGER DEFAULT 1;

-- Initialize existing organizations based on current subscriptionTier
UPDATE "organizations"
SET "maxEmployees" = 60,
    "maxKiosks" = NULL,
    "maxOffices" = NULL
WHERE LOWER("subscriptionTier") = 'enterprise';

UPDATE "organizations"
SET "maxEmployees" = 20,
    "maxKiosks" = 1,
    "maxOffices" = 1
WHERE LOWER("subscriptionTier") = 'starter';

UPDATE "organizations"
SET "maxEmployees" = 20,
    "maxKiosks" = 1,
    "maxOffices" = 1,
    "subscriptionTier" = 'starter'
WHERE LOWER("subscriptionTier") NOT IN ('enterprise', 'custom', 'starter');

-- CreateTable: kiosk_devices for PC hardware binding
CREATE TABLE IF NOT EXISTS "kiosk_devices" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "platform" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isBound" BOOLEAN NOT NULL DEFAULT true,
    "boundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kiosk_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "kiosk_devices_orgId_deviceId_key" ON "kiosk_devices"("orgId", "deviceId");
CREATE INDEX IF NOT EXISTS "kiosk_devices_orgId_isBound_idx" ON "kiosk_devices"("orgId", "isBound");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'kiosk_devices_orgId_fkey'
    ) THEN
        ALTER TABLE "kiosk_devices" ADD CONSTRAINT "kiosk_devices_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
