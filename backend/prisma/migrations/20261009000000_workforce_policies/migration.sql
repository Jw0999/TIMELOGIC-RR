CREATE TABLE "workforce_policies" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "config" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workforce_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workforce_policies_orgId_domain_version_key" ON "workforce_policies"("orgId", "domain", "version");
CREATE INDEX "workforce_policies_orgId_domain_status_effectiveFrom_idx" ON "workforce_policies"("orgId", "domain", "status", "effectiveFrom");

ALTER TABLE "workforce_policies" ADD CONSTRAINT "workforce_policies_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workforce_policies" ADD CONSTRAINT "workforce_policies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;