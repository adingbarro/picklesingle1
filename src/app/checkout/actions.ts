"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerEmail, getOrCreateCustomerByEmail } from "@/lib/customer";
import { generateConfirmationCode } from "@/lib/format";
import { generateSlots, groupContiguousSlots } from "@/lib/slots";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
  createCustomerSessionCookieValue,
  verifyCustomerCredentials,
} from "@/lib/customerAuth";

const SERVICE_FEE = 50;
// Upper bound on a single checkout, so a stray selection can't reserve a whole day.
const MAX_SLOTS_PER_CHECKOUT = 12;

export type LoginState = { error: string | null };

export async function loginCustomer(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!verifyCustomerCredentials(email, password)) {
    return { error: "Incorrect email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, createCustomerSessionCookieValue(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CUSTOMER_SESSION_MAX_AGE,
  });

  return { error: null };
}

export async function createBooking(input: {
  courtId: string;
  date: string;
  /** Hour slots the customer picked; they don't have to be contiguous. */
  starts: string[];
  players: number;
}) {
  const email = await getCurrentCustomerEmail();
  if (!email) {
    return { error: "Please sign in to complete your booking." };
  }

  const court = await prisma.court.findUnique({ where: { id: input.courtId } });
  if (!court) {
    return { error: "This court no longer exists." };
  }
  if (court.status !== "ACTIVE") {
    return { error: "This court is currently under maintenance and cannot be booked." };
  }

  const starts = [...new Set(input.starts)].sort();
  if (starts.length === 0) {
    return { error: "Please pick at least one time slot." };
  }
  if (starts.length > MAX_SLOTS_PER_CHECKOUT) {
    return { error: `You can book up to ${MAX_SLOTS_PER_CHECKOUT} hours at a time.` };
  }

  const date = new Date(`${input.date}T00:00:00.000Z`);
  const existingBookings = await prisma.booking.findMany({
    where: { courtId: court.id, date, status: "CONFIRMED" },
    select: { startTime: true, endTime: true },
  });

  // Re-check availability server-side: the unique constraint only guards a
  // booking's own start time, so a multi-hour block landing on top of an
  // existing booking's later hours would otherwise slip through.
  const bookable = new Set(
    generateSlots(court.opensAt, court.closesAt, court.is24Hours, 60, existingBookings)
      .filter((s) => s.available)
      .map((s) => s.start)
  );
  if (starts.some((s) => !bookable.has(s))) {
    return { error: "One of those times is no longer available. Please pick another." };
  }

  const players = Math.min(4, Math.max(2, input.players));
  const segments = groupContiguousSlots(starts);
  const customer = await getOrCreateCustomerByEmail(email);

  let bookingIds: string[];
  try {
    bookingIds = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const [i, segment] of segments.entries()) {
        const courtPrice = Math.round((court.pricePerHour * segment.minutes) / 60);
        // The service fee is charged once per checkout, so only the first
        // block carries it — summing the rows still gives the quoted total.
        const serviceFee = i === 0 ? SERVICE_FEE : 0;
        const booking = await tx.booking.create({
          data: {
            courtId: court.id,
            customerId: customer.id,
            date,
            startTime: segment.start,
            endTime: segment.end,
            durationMin: segment.minutes,
            players,
            courtPrice,
            serviceFee,
            totalPrice: courtPrice + serviceFee,
            confirmationCode: generateConfirmationCode(),
          },
        });
        ids.push(booking.id);
      }
      return ids;
    });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return { error: "That time slot was just booked by someone else. Please pick another." };
    }
    throw err;
  }

  redirect(`/confirmation/${bookingIds[0]}${bookingIds.length > 1 ? `?ids=${bookingIds.join(",")}` : ""}`);
}

export async function cancelBooking(bookingId: string) {
  const email = await getCurrentCustomerEmail();
  if (!email) return;

  const customer = await getOrCreateCustomerByEmail(email);
  await prisma.booking.updateMany({
    where: { id: bookingId, customerId: customer.id },
    data: { status: "CANCELLED" },
  });
}
