-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "smtpHost" TEXT,
ADD COLUMN "smtpPort" INTEGER DEFAULT 587,
ADD COLUMN "smtpUser" TEXT,
ADD COLUMN "smtpPass" TEXT,
ADD COLUMN "smtpFrom" TEXT,
ADD COLUMN "smtpSecure" BOOLEAN DEFAULT false;
