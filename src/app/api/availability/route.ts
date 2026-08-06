import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/slots";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courtId = searchParams.get("courtId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const duration = parseInt(searchParams.get("duration") ?? "60", 10);

  if (!courtId || !date) {
    return NextResponse.json({ error: "courtId and date are required" }, { status: 400 });
  }

  const court = await prisma.court.findUnique({ where: { id: courtId } });
  if (!court) {
    return NextResponse.json({ error: "Court not found" }, { status: 404 });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const bookings = await prisma.booking.findMany({
    where: { courtId, date: dayStart, status: "CONFIRMED" },
    select: { startTime: true, endTime: true },
  });

  const slots = generateSlots(court.opensAt, court.closesAt, court.is24Hours, duration, bookings);

  return NextResponse.json({
    court: {
      id: court.id,
      name: court.name,
      type: court.type,
      pricePerHour: court.pricePerHour,
      status: court.status,
      is24Hours: court.is24Hours,
    },
    slots,
  });
}
