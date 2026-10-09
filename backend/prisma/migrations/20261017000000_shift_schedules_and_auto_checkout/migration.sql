-- AlterTable: Add auto-checkout tracking to attendance_records
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "isAutoCheckedOut" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "autoCheckoutReason" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "shiftTypeSnapshot" TEXT;

-- AlterTable: Add shift & auto checkout policies to organizations and offices
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "autoCheckoutPolicy" JSONB;
ALTER TABLE "offices" ADD COLUMN IF NOT EXISTS "shiftSchedules" JSONB;
ALTER TABLE "offices" ADD COLUMN IF NOT EXISTS "midnightAutoCheckout" BOOLEAN DEFAULT TRUE;
ALTER TABLE "offices" ADD COLUMN IF NOT EXISTS "dayShiftCutoffTime" TEXT DEFAULT '00:00';
ALTER TABLE "offices" ADD COLUMN IF NOT EXISTS "nightShiftMaxHours" INTEGER DEFAULT 14;
