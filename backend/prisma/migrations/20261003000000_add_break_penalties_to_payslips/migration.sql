-- AlterTable payslip_records
ALTER TABLE "payslip_records" ADD COLUMN IF NOT EXISTS "breakPenalties" DOUBLE PRECISION NOT NULL DEFAULT 0;
