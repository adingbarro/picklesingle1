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

export type SlotSegment = { start: string; end: string; minutes: number };

/**
 * Collapse a set of individually-picked hour slots into the fewest bookable
 * blocks: ["01:00","02:00","04:00"] becomes a 2-hour block at 01:00 and a
 * 1-hour block at 04:00. Input is deduped and sorted, so callers can pass
 * selections in click order.
 */
export function groupContiguousSlots(starts: string[]): SlotSegment[] {
  const sorted = [...new Set(starts)].sort();
  const segments: SlotSegment[] = [];

  for (const start of sorted) {
    const last = segments[segments.length - 1];
    // "00:00" as an end means end-of-day (the 23:00 slot), which is always the
    // last one, so it can never match a following start.
    if (last && last.end !== "00:00" && timeToMinutes(last.end) === timeToMinutes(start)) {
      last.end = addMinutesToTime(start, SLOT_INTERVAL_MIN);
      last.minutes += SLOT_INTERVAL_MIN;
    } else {
      segments.push({ start, end: addMinutesToTime(start, SLOT_INTERVAL_MIN), minutes: SLOT_INTERVAL_MIN });
    }
  }

  return segments;
}

function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export { addMinutesToTime };
