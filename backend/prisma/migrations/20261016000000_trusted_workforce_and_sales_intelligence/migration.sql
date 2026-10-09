-- AlterTable: Add Trusted Workforce Record fields to attendance_records
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "lifecycleState" TEXT NOT NULL DEFAULT 'FINALIZED';
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "recordHash" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "rulesSnapshot" JSONB;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "evidencePackage" JSONB;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "calculatedSummary" JSONB;

-- CreateTable: sales_batch_imports
CREATE TABLE IF NOT EXISTS "sales_batch_imports" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "importedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "detectedPeriod" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "sales_batch_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sales_transactions
CREATE TABLE IF NOT EXISTS "sales_transactions" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "invoiceId" TEXT,
    "productName" TEXT NOT NULL,
    "productSku" TEXT,
    "categoryName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION,
    "profitMargin" DOUBLE PRECISION,
    "customerName" TEXT,
    "salespersonName" TEXT,
    "dedupeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sales_monthly_summaries
CREATE TABLE IF NOT EXISTS "sales_monthly_summaries" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION,
    "totalProfit" DOUBLE PRECISION,
    "profitMargin" DOUBLE PRECISION,
    "totalUnitsSold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uniqueProducts" INTEGER NOT NULL DEFAULT 0,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hasCostData" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_batch_imports_orgId_uploadedAt_idx" ON "sales_batch_imports"("orgId", "uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sales_transactions_dedupeHash_key" ON "sales_transactions"("dedupeHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_transactions_orgId_year_month_idx" ON "sales_transactions"("orgId", "year", "month");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_transactions_orgId_productName_idx" ON "sales_transactions"("orgId", "productName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_transactions_orgId_categoryName_idx" ON "sales_transactions"("orgId", "categoryName");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sales_monthly_summaries_orgId_year_month_key" ON "sales_monthly_summaries"("orgId", "year", "month");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sales_batch_imports_orgId_fkey'
    ) THEN
        ALTER TABLE "sales_batch_imports" ADD CONSTRAINT "sales_batch_imports_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sales_transactions_orgId_fkey'
    ) THEN
        ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sales_transactions_importBatchId_fkey'
    ) THEN
        ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "sales_batch_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sales_monthly_summaries_orgId_fkey'
    ) THEN
        ALTER TABLE "sales_monthly_summaries" ADD CONSTRAINT "sales_monthly_summaries_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
