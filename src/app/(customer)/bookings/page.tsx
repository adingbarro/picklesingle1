import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerEmail, getOrCreateCustomerByEmail } from "@/lib/customer";
import { todayManilaDateKey } from "@/lib/format";
import BookingsList, { type BookingRow } from "@/components/BookingsList";

export const dynamic = "force-dynamic";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function BookingsPage() {
  const email = await getCurrentCustomerEmail();
  if (!email) redirect("/login?next=/bookings");

  const customer = await getOrCreateCustomerByEmail(email);
  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    include: { court: true },
    orderBy: { date: "desc" },
  });

  const today = todayManilaDateKey();

  const rows: BookingRow[] = bookings.map((b) => {
    const dateKey = b.date.toISOString().slice(0, 10);
    return {
      id: b.id,
      courtName: b.court.name,
      courtType: b.court.type,
      dateKey,
      month: MONTHS[b.date.getUTCMonth()],
      day: b.date.getUTCDate(),
      startTime: b.startTime,
      endTime: b.endTime,
      players: b.players,
      totalPrice: b.totalPrice,
      status: b.status,
      isPast: dateKey < today,
    };
  });

  return (
    <>
      <div className="top">
        <h1>My Bookings</h1>
      </div>
      <BookingsList bookings={rows} />
    </>
  );
}
