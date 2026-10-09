ALTER TABLE "attendance_records" ADD COLUMN "overtimeMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "attendance_records" ADD COLUMN "overtimeEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "attendance_records" ADD COLUMN "overtimeRuleVersion" TEXT;