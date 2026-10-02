-- AlterTable organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "salaryPayoutDay" INTEGER NOT NULL DEFAULT 28;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "salaryAutomationEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "salaryCurrency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "whatsappProvider" TEXT DEFAULT 'META';
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "whatsappPhoneId" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "whatsappApiToken" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "whatsappSenderNumber" TEXT;

-- AlterTable users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "baseSalary" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "salaryCurrency" TEXT NOT NULL DEFAULT 'NGN';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountNumber" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountName" TEXT;

-- CreateTable payslip_records
CREATE TABLE IF NOT EXISTS "payslip_records" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "totalWorkHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPresentDays" INTEGER NOT NULL DEFAULT 0,
    "totalLateDays" INTEGER NOT NULL DEFAULT 0,
    "totalLateMinutes" INTEGER NOT NULL DEFAULT 0,
    "attendancePenalties" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manualPenalties" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "breakdownJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "pdfUrl" TEXT,
    "pdfPath" TEXT,
    "whatsappStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "whatsappSentAt" TIMESTAMP(3),
    "whatsappError" TEXT,
    "whatsappMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslip_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payslip_records_employeeId_year_month_key" ON "payslip_records"("employeeId", "year", "month");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payslip_records_orgId_year_month_idx" ON "payslip_records"("orgId", "year", "month");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payslip_records_orgId_fkey'
    ) THEN
        ALTER TABLE "payslip_records" ADD CONSTRAINT "payslip_records_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payslip_records_employeeId_fkey'
    ) THEN
        ALTER TABLE "payslip_records" ADD CONSTRAINT "payslip_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
