-- AlterEnum
ALTER TYPE "ShiftType" ADD VALUE IF NOT EXISTS 'FULL_TIME';
ALTER TYPE "ShiftType" ADD VALUE IF NOT EXISTS 'EVENING';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "kioskPasswordHash" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "shiftSchedules" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "officeId" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_officeId_fkey'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
