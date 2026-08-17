import type { BookingStatus } from "@/generated/prisma/enums";

/**
 * Statuses that still occupy a court slot. A PENDING booking blocks the slot
 * exactly like a CONFIRMED one — it's only released once the admin declines it
 * or the customer cancels — so every availability query must filter on this
 * list, never on `status: "CONFIRMED"` alone.
 */
export const LIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const satisfies BookingStatus[];

/** Prisma `where` fragment for "this booking still holds its slot". */
export const liveBookingWhere = { status: { in: [...LIVE_BOOKING_STATUSES] } };

/**
 * Value for `Booking.slotHold` — the unique key a live booking parks on so the
 * database itself rejects a second booking of the same court/date/start time.
 * Set it on create, null it the moment the booking stops holding the slot.
 */
export function slotHoldKey(courtId: string, dateKey: string, startTime: string): string {
  return `${courtId}|${dateKey}|${startTime}`;
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

/** Badge colour class (see `.badge.*` in globals.css) for each status. */
export const BOOKING_STATUS_BADGE: Record<BookingStatus, string> = {
  PENDING: "amber",
  CONFIRMED: "lime",
  DECLINED: "red",
  CANCELLED: "gray",
};
