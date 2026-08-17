"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ADMIN_SESSION_COOKIE, isValidSessionCookieValue } from "@/lib/adminAuth";

type Result = { error: string } | { success: true };

// `src/proxy.ts` already gates every /admin/* request, server actions included,
// but these write to other people's bookings — cheap enough to check again here.
async function isAdmin() {
  const cookieStore = await cookies();
  return isValidSessionCookieValue(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function revalidateBookingViews() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin", "layout");
  revalidatePath("/bookings");
}

/** Approve a pending booking. It already holds its slot, so nothing to re-check. */
export async function approveBooking(bookingId: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not signed in as admin." };

  const { count } = await prisma.booking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CONFIRMED", reviewedAt: new Date() },
  });
  if (count === 0) return { error: "That booking is no longer pending." };

  revalidateBookingViews();
  return { success: true };
}

/**
 * Decline a pending booking. Clearing `slotHold` is what hands the hour back —
 * declined bookings are terminal, so the customer books again if they still want
 * it rather than the admin un-declining into a slot someone else has taken.
 */
export async function declineBooking(bookingId: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not signed in as admin." };

  const { count } = await prisma.booking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "DECLINED", reviewedAt: new Date(), slotHold: null },
  });
  if (count === 0) return { error: "That booking is no longer pending." };

  revalidateBookingViews();
  return { success: true };
}

/** Call off an already-approved booking; also releases the hour. */
export async function cancelBookingAsAdmin(bookingId: string): Promise<Result> {
  if (!(await isAdmin())) return { error: "Not signed in as admin." };

  const { count } = await prisma.booking.updateMany({
    where: { id: bookingId, status: "CONFIRMED" },
    data: { status: "CANCELLED", reviewedAt: new Date(), slotHold: null },
  });
  if (count === 0) return { error: "That booking is no longer confirmed." };

  revalidateBookingViews();
  return { success: true };
}
