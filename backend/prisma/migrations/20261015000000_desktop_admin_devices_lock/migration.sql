-- AlterTable organizations: add maxDesktopAdmins
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "maxDesktopAdmins" INTEGER DEFAULT 1;

-- AlterTable kiosk_devices: add deviceType and firmwareVersion
ALTER TABLE "kiosk_devices" ADD COLUMN IF NOT EXISTS "deviceType" TEXT NOT NULL DEFAULT 'KIOSK';
ALTER TABLE "kiosk_devices" ADD COLUMN IF NOT EXISTS "firmwareVersion" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "kiosk_devices_orgId_deviceType_idx" ON "kiosk_devices"("orgId", "deviceType");
