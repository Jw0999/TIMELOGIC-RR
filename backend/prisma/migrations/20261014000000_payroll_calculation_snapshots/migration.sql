ALTER TABLE "attendance_records" ADD COLUMN "overtimeDetails" JSONB;
ALTER TABLE "payslip_records" ADD COLUMN "grossSalary" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "payslip_records" ADD COLUMN "calculationVersion" TEXT;
ALTER TABLE "payslip_records" ADD COLUMN "calculationHash" TEXT;
ALTER TABLE "payslip_records" ADD COLUMN "calculationSnapshot" JSONB;