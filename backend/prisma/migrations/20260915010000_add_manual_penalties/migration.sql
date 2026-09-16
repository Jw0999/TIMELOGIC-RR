CREATE TABLE IF NOT EXISTS "manual_penalties" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "manual_penalties_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "manual_penalties_orgId_employeeId_createdAt_idx" ON "manual_penalties"("orgId", "employeeId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manual_penalties_orgId_fkey') THEN
    ALTER TABLE "manual_penalties" ADD CONSTRAINT "manual_penalties_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manual_penalties_employeeId_fkey') THEN
    ALTER TABLE "manual_penalties" ADD CONSTRAINT "manual_penalties_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manual_penalties_createdById_fkey') THEN
    ALTER TABLE "manual_penalties" ADD CONSTRAINT "manual_penalties_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON UPDATE CASCADE;
  END IF;
END $$;