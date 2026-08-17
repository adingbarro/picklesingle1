-- New customer bookings start life awaiting admin approval.
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- When the admin approved/declined it.
ALTER TABLE "Booking" ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- Replace the always-on unique on (courtId, date, startTime) with a nullable
-- "slot hold" key: the row holds it while the booking is live and gives it up
-- (null) once declined or cancelled, so the slot becomes bookable again.
ALTER TABLE "Booking" ADD COLUMN "slotHold" TEXT;

UPDATE "Booking"
SET "slotHold" = "courtId" || '|' || to_char("date", 'YYYY-MM-DD') || '|' || "startTime"
WHERE "status" = 'CONFIRMED';

DROP INDEX "Booking_courtId_date_startTime_key";

CREATE UNIQUE INDEX "Booking_slotHold_key" ON "Booking"("slotHold");
CREATE INDEX "Booking_courtId_date_idx" ON "Booking"("courtId", "date");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
