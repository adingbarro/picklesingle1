import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateLabel, timeLabel } from "@/lib/format";
import { groupContiguousSlots } from "@/lib/slots";
import { getCurrentCustomerEmail } from "@/lib/customer";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: PageProps<"/checkout">) {
  const sp = await searchParams;
  const courtId = typeof sp.courtId === "string" ? sp.courtId : undefined;
  const date = typeof sp.date === "string" ? sp.date : undefined;
  // Two entry points: the homepage passes a list of picked hours (`starts`),
  // the court detail page passes a single start plus a duration.
  const startsParam = typeof sp.starts === "string" ? sp.starts : undefined;
  const start = typeof sp.start === "string" ? sp.start : undefined;
  const duration = typeof sp.duration === "string" ? parseInt(sp.duration, 10) : 60;

  const starts = startsParam
    ? startsParam.split(",").filter((s) => /^\d{2}:\d{2}$/.test(s))
    : start
      ? expandToHourSlots(start, duration)
      : [];

  if (!courtId || !date || starts.length === 0) notFound();

  const court = await prisma.court.findUnique({ where: { id: courtId } });
  if (!court) notFound();

  const segments = groupContiguousSlots(starts);
  const totalMinutes = segments.reduce((sum, s) => sum + s.minutes, 0);
  const courtPrice = Math.round((court.pricePerHour * totalMinutes) / 60);
  const serviceFee = 50;

  const isLoggedIn = (await getCurrentCustomerEmail()) !== null;

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
                🗓️ {formatDateLabel(new Date(`${date}T00:00:00.000Z`))}
              </div>
              {segments.map((s) => (
                <div key={s.start} className="court-meta" style={{ marginTop: 4 }}>
                  ⏰ {timeLabel(s.start)} – {timeLabel(s.end)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CheckoutForm
        courtId={court.id}
        date={date}
        starts={starts}
        totalMinutes={totalMinutes}
        courtPrice={courtPrice}
        serviceFee={serviceFee}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

/** "10:00" + 120 min -> ["10:00", "11:00"] */
function expandToHourSlots(start: string, duration: number): string[] {
  const hours = Math.max(1, Math.round(duration / 60));
  const [h, m] = start.split(":").map(Number);
  return Array.from({ length: hours }, (_, i) => {
    const hh = (h + i) % 24;
    return `${hh.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });
}
