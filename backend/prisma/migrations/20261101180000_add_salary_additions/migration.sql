CREATE TABLE IF NOT EXISTS "salary_additions" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'BONUS',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salary_additions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "salary_additions_orgId_employeeId_createdAt_idx" ON "salary_additions"("orgId", "employeeId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salary_additions_orgId_fkey') THEN
    ALTER TABLE "salary_additions" ADD CONSTRAINT "salary_additions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salary_additions_employeeId_fkey') THEN
    ALTER TABLE "salary_additions" ADD CONSTRAINT "salary_additions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salary_additions_createdById_fkey') THEN
    ALTER TABLE "salary_additions" ADD CONSTRAINT "salary_additions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "payslip_records" ADD COLUMN IF NOT EXISTS "salaryAdditions" DOUBLE PRECISION NOT NULL DEFAULT 0;
