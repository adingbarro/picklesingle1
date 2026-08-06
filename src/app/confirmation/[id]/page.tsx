import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { peso, formatDateLabel, timeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: PageProps<"/confirmation/[id]">) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { court: true },
  });

  if (!booking) notFound();

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
          <div className="row">
            <span>Time</span>
            <span>
              {timeLabel(booking.startTime)} – {timeLabel(booking.endTime)}
            </span>
          </div>
          <div className="row">
            <span>Players</span>
            <span>{booking.players}</span>
          </div>
          <hr />
          <div className="row">
            <span>Confirmation #</span>
            <span>{booking.confirmationCode}</span>
          </div>
          <div className="row">
            <span>Amount due</span>
            <span>{peso(booking.totalPrice)}</span>
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
