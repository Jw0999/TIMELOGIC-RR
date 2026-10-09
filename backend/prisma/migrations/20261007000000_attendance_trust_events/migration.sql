CREATE TABLE "attendance_events" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "sessionId" TEXT,
    "attendanceRecordId" TEXT,
    "eventType" TEXT NOT NULL,
    "source" "AttendanceSource" NOT NULL,
    "result" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientTimestamp" TIMESTAMP(3),
    "deviceId" TEXT,
    "networkEvidence" JSONB,
    "identityEvidence" JSONB,
    "livenessEvidence" JSONB,
    "ruleVersion" TEXT,
    "outcome" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_events_orgId_idempotencyKey_key" ON "attendance_events"("orgId", "idempotencyKey");
CREATE INDEX "attendance_events_orgId_serverTimestamp_idx" ON "attendance_events"("orgId", "serverTimestamp");
CREATE INDEX "attendance_events_employeeId_serverTimestamp_idx" ON "attendance_events"("employeeId", "serverTimestamp");
CREATE INDEX "attendance_events_attendanceRecordId_idx" ON "attendance_events"("attendanceRecordId");

ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_attendanceRecordId_fkey" FOREIGN KEY ("attendanceRecordId") REFERENCES "attendance_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;