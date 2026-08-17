import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isOpenNow, timeToMinutes } from "@/lib/format";
import { getCurrentCustomerEmail, getOrCreateCustomerByEmail } from "@/lib/customer";
import HomeDateAndCourts from "@/components/HomeDateAndCourts";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const email = await getCurrentCustomerEmail();
  const customer = email ? await getOrCreateCustomerByEmail(email) : null;

  const [settings, allCourts, facilities] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.court.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.facility.findMany({ where: { enabled: true } }),
  ]);

  const courts = allCourts.slice(0, 4);
  const companyName = settings?.companyName ?? "Pickleball Club";
  const initial = companyName.trim().charAt(0).toUpperCase() || "?";
  const indoorCount = allCourts.filter((c) => c.type === "INDOOR").length;
  const outdoorCount = allCourts.filter((c) => c.type === "OUTDOOR").length;

  const activeCourts = allCourts.filter((c) => c.status === "ACTIVE");
  const openCourts = activeCourts.filter((c) => c.is24Hours || isOpenNow(c.opensAt, c.closesAt));
  const open = openCourts.length > 0;
  const anyOpen24 = openCourts.some((c) => c.is24Hours);
  const latestClose = openCourts
    .filter((c) => !c.is24Hours)
    .reduce<string | null>((latest, c) => (!latest || timeToMinutes(c.closesAt) > timeToMinutes(latest) ? c.closesAt : latest), null);
  const earliestOpen = activeCourts.reduce<string | null>(
    (earliest, c) => (!earliest || timeToMinutes(c.opensAt) < timeToMinutes(earliest) ? c.opensAt : earliest),
    null
  );

  return (
    <>
      <div className="top">
        <div className="brand-row">
          <div className="logo-mark">
            {settings?.logoDataUrl ? <img src={settings.logoDataUrl} alt="" /> : initial}
          </div>
          <div>
            <h1>{companyName}</h1>
            {customer && (
              <div className="subtitle" style={{ marginTop: 0 }}>
                Hey {customer.name.split(" ")[0]} 👋
              </div>
            )}
          </div>
        </div>
        <div className="icon-btn">
          <div className="dot" />
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </div>
      </div>

      <div className="club-hero">
        <div className="status-row">
          <span className={`badge ${open ? "lime" : "gray"}`}>{open ? "Open Now" : "Closed"}</span>
          {open && (
            <span style={{ fontSize: 12, opacity: 0.9 }}>
              {anyOpen24 ? "Open 24 Hours" : latestClose ? `until ${to12h(latestClose)}` : null}
            </span>
          )}
          {!open && earliestOpen && (
            <span style={{ fontSize: 12, opacity: 0.9 }}>opens {to12h(earliestOpen)}</span>
          )}
        </div>
        <div className="name">{companyName}</div>
        {settings?.address && (
          <div className="meta">
            <span>📍 {settings.address}</span>
          </div>
        )}
        <div className="stats">
          <div className="stat">
            <b>{allCourts.length}</b>
            <span>Courts</span>
          </div>
          <div className="stat">
            <b>{indoorCount}</b>
            <span>Indoor</span>
          </div>
          <div className="stat">
            <b>{outdoorCount}</b>
            <span>Outdoor</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <Link href="/book" className="qa-btn">
          <div className="ic">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4M16 3v4M3 10h18" />
            </svg>
          </div>
          <span>Book a Court</span>
        </Link>
        <div className="qa-btn">
          <div className="ic">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <span>Open Play</span>
        </div>
        <div className="qa-btn">
          <div className="ic">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2 3 7l9 5 9-5-9-5z" />
              <path d="M3 12l9 5 9-5" />
            </svg>
          </div>
          <span>Clinics</span>
        </div>
      </div>

      <HomeDateAndCourts
        courts={courts.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          pricePerHour: c.pricePerHour,
          lighted: c.lighted,
          is24Hours: c.is24Hours,
          status: c.status,
        }))}
      />

      {facilities.length > 0 && (
        <>
          <div className="section-head">
            <h3>Facilities</h3>
          </div>
          <div className="facility-list">
            {facilities.map((f) => (
              <div key={f.id} className="facility-list-item">
                <span className="fi-icon">{f.icon}</span>
                <span className="fi-label">{f.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="privacy-notice">
        We only use your info to run your account and bookings. See our{" "}
        <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    </>
  );
}

function to12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mStr} ${ampm}`;
}
