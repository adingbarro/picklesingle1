import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/slots";

// Reference duration used to decide whether a day still has any bookable slot.
// 60 min is the shortest booking duration offered, so it's the most permissive check.
const REFERENCE_DURATION = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10); // 1-12
  // Optional: narrow the check to a single court instead of "any court is free".
  const courtId = searchParams.get("courtId") ?? undefined;

  if (!year || !month || month < 1 || month > 12) {
    return NextResponse.json({ error: "valid year and month (1-12) are required" }, { status: 400 });
  }

  const activeCourts = await prisma.court.findMany({
    where: { status: "ACTIVE", ...(courtId ? { id: courtId } : {}) },
  });
  if (activeCourts.length === 0) {
    return NextResponse.json({ fullyBooked: [] });
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const bookings = await prisma.booking.findMany({
    where: { date: { gte: monthStart, lt: monthEnd }, status: "CONFIRMED", ...(courtId ? { courtId } : {}) },
    select: { date: true, courtId: true, startTime: true, endTime: true },
  });

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const fullyBooked: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayBookings = bookings.filter((b) => b.date.toISOString().slice(0, 10) === dateKey);

    const anyAvailable = activeCourts.some((c) => {
      const courtBookings = dayBookings.filter((b) => b.courtId === c.id);
      const slots = generateSlots(c.opensAt, c.closesAt, c.is24Hours, REFERENCE_DURATION, courtBookings);
      return slots.some((s) => s.available);
    });

    if (!anyAvailable) fullyBooked.push(dateKey);
  }

  return NextResponse.json({ fullyBooked });
}
