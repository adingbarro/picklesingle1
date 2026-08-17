import { prisma } from "@/lib/prisma";
import { formatDateLabel, todayManilaDateKey } from "@/lib/format";
import BookingsManager, { type AdminBookingRow, type StatusFilter } from "@/components/admin/BookingsManager";

export const dynamic = "force-dynamic";

const FILTERS = ["PENDING", "CONFIRMED", "DECLINED", "CANCELLED", "ALL"] as const;

function parseFilter(value: string | string[] | undefined): StatusFilter {
  return typeof value === "string" && (FILTERS as readonly string[]).includes(value)
    ? (value as StatusFilter)
    : "PENDING";
}

export default async function AdminBookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  const sp = await searchParams;
  const filter = parseFilter(sp.status);

  const [bookings, byStatus] = await Promise.all([
    prisma.booking.findMany({
      where: filter === "ALL" ? {} : { status: filter },
      include: { court: true, customer: true },
      // Pending is a to-do list, so the soonest game comes first; the other tabs
      // are history, so they read newest-first.
      orderBy:
        filter === "PENDING"
          ? [{ date: "asc" }, { startTime: "asc" }]
          : [{ date: "desc" }, { startTime: "asc" }],
      take: 300,
    }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const today = todayManilaDateKey();

  const rows: AdminBookingRow[] = bookings.map((b) => {
    const dateKey = b.date.toISOString().slice(0, 10);
    return {
      id: b.id,
      confirmationCode: b.confirmationCode,
      customerName: b.customer.name,
      customerEmail: b.customer.email,
      customerPhone: b.customer.phone,
      courtName: b.court.name,
      courtType: b.court.type,
      dateLabel: formatDateLabel(b.date),
      dateKey,
      startTime: b.startTime,
      endTime: b.endTime,
      players: b.players,
      totalPrice: b.totalPrice,
      status: b.status,
      isPast: dateKey < today,
    };
  });

  const counts = Object.fromEntries(byStatus.map((g) => [g.status, g._count._all]));

  return <BookingsManager rows={rows} filter={filter} counts={counts} />;
}
