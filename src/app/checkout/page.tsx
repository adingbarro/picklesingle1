import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, timeLabel, addMinutesToTime } from "@/lib/format";
import { CUSTOMER_SESSION_COOKIE, readCustomerSessionEmail } from "@/lib/customerAuth";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: PageProps<"/checkout">) {
  const sp = await searchParams;
  const courtId = typeof sp.courtId === "string" ? sp.courtId : undefined;
  const date = typeof sp.date === "string" ? sp.date : undefined;
  const start = typeof sp.start === "string" ? sp.start : undefined;
  const duration = typeof sp.duration === "string" ? parseInt(sp.duration, 10) : 60;

  if (!courtId || !date || !start) notFound();

  const court = await prisma.court.findUnique({ where: { id: courtId } });
  if (!court) notFound();

  const endTime = addMinutesToTime(start, duration);
  const courtPrice = Math.round((court.pricePerHour * duration) / 60);
  const serviceFee = 50;

  const cookieStore = await cookies();
  const isLoggedIn = readCustomerSessionEmail(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value) !== null;

  return (
    <div className="app-shell" style={{ paddingBottom: 0 }}>
      <div className="top" style={{ paddingTop: 16 }}>
        <Link href={`/courts/${court.id}`} className="icon-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 style={{ fontSize: 17 }}>Confirm Booking</h1>
        <div style={{ width: 38 }} />
      </div>

      <div className="px" style={{ marginTop: 6 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="court-row">
            <div>
              <div className="court-name">
                {court.name} · {court.type === "INDOOR" ? "Indoor" : "Outdoor"}
              </div>
              <div className="court-meta" style={{ marginTop: 6 }}>
                🗓️ {formatDateLabel(new Date(`${date}T00:00:00.000Z`))} · ⏰ {timeLabel(start)} – {timeLabel(endTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CheckoutForm
        courtId={court.id}
        date={date}
        start={start}
        duration={duration}
        courtPrice={courtPrice}
        serviceFee={serviceFee}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
