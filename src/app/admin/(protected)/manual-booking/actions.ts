"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { addMinutesToTime, generateConfirmationCode } from "@/lib/format";

export async function createManualBooking(input: {
  courtId: string;
  date: string;
  start: string;
  duration: number;
  players: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  const name = input.customerName.trim();
  if (!name) {
    return { error: "Customer name is required." };
  }

  const court = await prisma.court.findUnique({ where: { id: input.courtId } });
  if (!court) {
    return { error: "This court no longer exists." };
  }
  if (court.status !== "ACTIVE") {
    return { error: "This court is currently under maintenance and cannot be booked." };
  }

  const duration = [60, 120].includes(input.duration) ? input.duration : 60;
  const players = Math.min(4, Math.max(1, input.players));
  const endTime = addMinutesToTime(input.start, duration);
  const courtPrice = Math.round((court.pricePerHour * duration) / 60);

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
    const booking = await prisma.booking.create({
      data: {
        courtId: court.id,
        customerId: customer.id,
        date: new Date(`${input.date}T00:00:00.000Z`),
        startTime: input.start,
        endTime,
        durationMin: duration,
        players,
        courtPrice,
        serviceFee: 0,
        totalPrice: courtPrice,
        confirmationCode: generateConfirmationCode(),
      },
    });
    revalidatePath("/admin/manual-booking");
    revalidatePath("/bookings");
    return { success: true as const, confirmationCode: booking.confirmationCode };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return { error: "That time slot was just booked. Please pick another." };
    }
    throw err;
  }
}
