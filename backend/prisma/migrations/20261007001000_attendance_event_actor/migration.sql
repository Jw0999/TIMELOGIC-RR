ALTER TABLE "attendance_events" ADD COLUMN "actorId" TEXT;

ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;