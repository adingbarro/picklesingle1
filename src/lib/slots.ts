import { timeToMinutes, addMinutesToTime } from "./format";

export type Slot = {
  start: string;
  end: string;
  available: boolean;
};

const SLOT_INTERVAL_MIN = 60;
const MINUTES_PER_DAY = 24 * 60;

export function generateSlots(
  opensAt: string,
  closesAt: string,
  is24Hours: boolean,
  durationMin: number,
  existingBookings: { startTime: string; endTime: string }[]
): Slot[] {
  const openMin = is24Hours ? 0 : timeToMinutes(opensAt);
  const closeMin = is24Hours ? MINUTES_PER_DAY : timeToMinutes(closesAt);
  const slots: Slot[] = [];

  for (let start = openMin; start + durationMin <= closeMin; start += SLOT_INTERVAL_MIN) {
    const end = start + durationMin;
    const startStr = minutesToTime(start);
    const endStr = minutesToTime(end);

    const overlaps = existingBookings.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEndRaw = timeToMinutes(b.endTime);
      // A booking's end time can serialize as "00:00" when it runs to the
      // end of the day (e.g. a 24-hour court's last slot, 23:00-00:00).
      // Treat that as end-of-day (1440), not midnight-of-this-day (0), or
      // the wrap-around booking silently fails to block the slot it covers.
      const bEnd = bEndRaw <= bStart ? bEndRaw + MINUTES_PER_DAY : bEndRaw;
      return start < bEnd && end > bStart;
    });

    slots.push({ start: startStr, end: endStr, available: !overlaps });
  }

  return slots;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export { addMinutesToTime };
