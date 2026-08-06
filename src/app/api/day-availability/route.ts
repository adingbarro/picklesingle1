import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/slots";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const duration = parseInt(searchParams.get("duration") ?? "60", 10);

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const courts = await prisma.court.findMany({ orderBy: { sortOrder: "asc" } });
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const bookings = await prisma.booking.findMany({
    where: { date: dayStart, status: "CONFIRMED" },
    select: { courtId: true, startTime: true, endTime: true },
  });

  const courtsWithSlots = courts.map((c) => {
    const courtBookings = bookings.filter((b) => b.courtId === c.id);
    const slots =
      c.status === "ACTIVE"
        ? generateSlots(c.opensAt, c.closesAt, c.is24Hours, duration, courtBookings)
        : [];
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      pricePerHour: c.pricePerHour,
      status: c.status,
      is24Hours: c.is24Hours,
      slots,
    };
  });

  return NextResponse.json({ courts: courtsWithSlots });
}
