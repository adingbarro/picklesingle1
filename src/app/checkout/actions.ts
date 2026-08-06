"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDemoCustomer, getOrCreateCustomerByEmail } from "@/lib/customer";
import { addMinutesToTime, generateConfirmationCode } from "@/lib/format";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
  createCustomerSessionCookieValue,
  readCustomerSessionEmail,
  verifyCustomerCredentials,
} from "@/lib/customerAuth";

const SERVICE_FEE = 50;

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
  start: string;
  duration: number;
  players: number;
}) {
  const cookieStore = await cookies();
  const email = readCustomerSessionEmail(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
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

  const duration = [60, 120].includes(input.duration) ? input.duration : 60;
  const players = Math.min(4, Math.max(2, input.players));
  const endTime = addMinutesToTime(input.start, duration);
  const courtPrice = Math.round((court.pricePerHour * duration) / 60);
  const totalPrice = courtPrice + SERVICE_FEE;

  const customer = await getOrCreateCustomerByEmail(email);

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
        serviceFee: SERVICE_FEE,
        totalPrice,
        confirmationCode: generateConfirmationCode(),
      },
    });
    redirect(`/confirmation/${booking.id}`);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return { error: "That time slot was just booked by someone else. Please pick another." };
    }
    throw err;
  }
}

export async function cancelBooking(bookingId: string) {
  const customer = await getDemoCustomer();
  await prisma.booking.updateMany({
    where: { id: bookingId, customerId: customer.id },
    data: { status: "CANCELLED" },
  });
}
