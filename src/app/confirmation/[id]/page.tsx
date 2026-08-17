import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { peso, formatDateLabel, timeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params, searchParams }: PageProps<"/confirmation/[id]">) {
  const { id } = await params;
  const sp = await searchParams;

  // Picking non-contiguous hours creates one booking per block; `ids` carries
  // the whole set so the confirmation shows the full reservation, not just one.
  const idsParam = typeof sp.ids === "string" ? sp.ids.split(",").filter(Boolean) : [];
  const ids = [...new Set([id, ...idsParam])];

  const bookings = await prisma.booking.findMany({
    where: { id: { in: ids } },
    include: { court: true },
    orderBy: { startTime: "asc" },
  });

  const booking = bookings.find((b) => b.id === id);
  if (!booking) notFound();

  // Only group bookings that really belong together.
  const group = bookings.filter(
    (b) =>
      b.customerId === booking.customerId &&
      b.courtId === booking.courtId &&
      b.date.getTime() === booking.date.getTime()
  );
  const amountDue = group.reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="app-shell">
      <div className="confirm-wrap">
        <div className="check-circle">
          <div className="inner">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>
        <h1 style={{ fontSize: 21 }}>Booking Confirmed!</h1>
        <p className="subtitle" style={{ marginTop: 8 }}>
          Your court is reserved. See you on the baseline 🏓
        </p>

        <div className="card ticket">
          <div className="row">
            <span>Court</span>
            <span>
              {booking.court.name} · {booking.court.type === "INDOOR" ? "Indoor" : "Outdoor"}
            </span>
          </div>
          <div className="row">
            <span>Date</span>
            <span>{formatDateLabel(booking.date)}</span>
          </div>
          {group.map((b, i) => (
            <div className="row" key={b.id}>
              <span>{i === 0 ? "Time" : ""}</span>
              <span>
                {timeLabel(b.startTime)} – {timeLabel(b.endTime)}
              </span>
            </div>
          ))}
          <div className="row">
            <span>Players</span>
            <span>{booking.players}</span>
          </div>
          <hr />
          <div className="row">
            <span>Confirmation #</span>
            <span>{group.map((b) => b.confirmationCode).join(", ")}</span>
          </div>
          <div className="row">
            <span>Amount due</span>
            <span>{peso(amountDue)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 24 }}>
          <Link href="/" className="pill-btn secondary" style={{ flex: 1, justifyContent: "center" }}>
            Done
          </Link>
          <Link href="/bookings" className="pill-btn" style={{ flex: 1, justifyContent: "center" }}>
            View Booking
          </Link>
        </div>
      </div>
    </div>
  );
}
