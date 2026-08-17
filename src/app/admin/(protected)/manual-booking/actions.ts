"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateConfirmationCode } from "@/lib/format";
import { generateSlots, groupContiguousSlots } from "@/lib/slots";
import { liveBookingWhere, slotHoldKey } from "@/lib/bookingStatus";

// Upper bound on one manual booking, across all courts picked.
const MAX_SLOTS = 24;

export async function createManualBooking(input: {
  /** Hour slots the admin picked; they can span several courts and needn't be contiguous. */
  picks: { courtId: string; start: string }[];
  date: string;
  players: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  const name = input.customerName.trim();
  if (!name) {
    return { error: "Customer name is required." };
  }

  const picks = [...new Map(input.picks.map((p) => [`${p.courtId}|${p.start}`, p])).values()];
  if (picks.length === 0) {
    return { error: "Pick at least one time slot." };
  }
  if (picks.length > MAX_SLOTS) {
    return { error: `You can book up to ${MAX_SLOTS} hours at a time.` };
  }

  const startsByCourt = new Map<string, string[]>();
  for (const p of picks) {
    startsByCourt.set(p.courtId, [...(startsByCourt.get(p.courtId) ?? []), p.start]);
  }

  const date = new Date(`${input.date}T00:00:00.000Z`);
  const courts = await prisma.court.findMany({ where: { id: { in: [...startsByCourt.keys()] } } });
  if (courts.length !== startsByCourt.size) {
    return { error: "One of those courts no longer exists." };
  }
  const maintenance = courts.find((c) => c.status !== "ACTIVE");
  if (maintenance) {
    return { error: `${maintenance.name} is under maintenance and cannot be booked.` };
  }

  // Availability has to be re-checked here: the slot-hold constraint only guards
  // a booking's own start time, so a multi-hour block overlapping an existing
  // booking's later hours would otherwise go through.
  const rows: {
    courtId: string;
    startTime: string;
    endTime: string;
    durationMin: number;
    courtPrice: number;
  }[] = [];

  for (const court of courts) {
    const starts = startsByCourt.get(court.id)!;
    const existingBookings = await prisma.booking.findMany({
      where: { courtId: court.id, date, ...liveBookingWhere },
      select: { startTime: true, endTime: true },
    });
    const bookable = new Set(
      generateSlots(court.opensAt, court.closesAt, court.is24Hours, 60, existingBookings)
        .filter((s) => s.available)
        .map((s) => s.start)
    );
    if (starts.some((s) => !bookable.has(s))) {
      return { error: `One of the times picked on ${court.name} is no longer available.` };
    }

    for (const segment of groupContiguousSlots(starts)) {
      rows.push({
        courtId: court.id,
        startTime: segment.start,
        endTime: segment.end,
        durationMin: segment.minutes,
        courtPrice: Math.round((court.pricePerHour * segment.minutes) / 60),
      });
    }
  }

  const players = Math.min(4, Math.max(1, input.players));
  const email = input.customerEmail?.trim() || null;
  const phone = input.customerPhone?.trim() || null;

  const customer = email
    ? await prisma.customer.upsert({
        where: { email },
        update: { name, phone: phone ?? undefined },
        create: { name, email, phone },
      })
    : await prisma.customer.create({ data: { name, phone } });

  try {
    const confirmationCodes = await prisma.$transaction(async (tx) => {
      const codes: string[] = [];
      for (const row of rows) {
        const booking = await tx.booking.create({
          data: {
            ...row,
            customerId: customer.id,
            date,
            players,
            serviceFee: 0,
            totalPrice: row.courtPrice,
            // The admin is the approver, so a booking they take themselves is
            // confirmed on the spot — no pending step.
            status: "CONFIRMED",
            slotHold: slotHoldKey(row.courtId, input.date, row.startTime),
            confirmationCode: generateConfirmationCode(),
          },
        });
        codes.push(booking.confirmationCode);
      }
      return codes;
    });

    revalidatePath("/admin/manual-booking");
    revalidatePath("/admin/bookings");
    revalidatePath("/bookings");
    return { success: true as const, confirmationCodes };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return { error: "That time slot was just booked. Please pick another." };
    }
    throw err;
  }
}
