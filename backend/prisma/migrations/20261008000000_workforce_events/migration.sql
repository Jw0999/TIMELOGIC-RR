CREATE TABLE "work_events" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINALIZED',
    "sessionId" TEXT,
    "deviceId" TEXT,
    "verificationId" TEXT,
    "ruleVersion" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "work_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "work_events_dedupeKey_key" ON "work_events"("dedupeKey");
CREATE INDEX "work_events_orgId_occurredAt_idx" ON "work_events"("orgId", "occurredAt");
CREATE INDEX "work_events_employeeId_occurredAt_idx" ON "work_events"("employeeId", "occurredAt");
CREATE INDEX "work_events_employeeId_type_occurredAt_idx" ON "work_events"("employeeId", "type", "occurredAt");
CREATE INDEX "work_events_sourceType_sourceId_idx" ON "work_events"("sourceType", "sourceId");

ALTER TABLE "work_events" ADD CONSTRAINT "work_events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_events" ADD CONSTRAINT "work_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_events" ADD CONSTRAINT "work_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;