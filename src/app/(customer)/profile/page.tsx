import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomerEmail, getOrCreateCustomerByEmail } from "@/lib/customer";
import { todayManilaDateKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const email = await getCurrentCustomerEmail();
  if (!email) redirect("/login?next=/profile");

  const customer = await getOrCreateCustomerByEmail(email);
  const bookings = await prisma.booking.findMany({ where: { customerId: customer.id } });
  const today = todayManilaDateKey();

  const gamesPlayed = bookings.filter(
    (b) => b.status === "CONFIRMED" && b.date.toISOString().slice(0, 10) < today
  ).length;
  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" && b.date.toISOString().slice(0, 10) >= today
  ).length;

  const initials = customer.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <>
      <div className="top">
        <h1>Profile</h1>
      </div>
      <div className="profile-head">
        <div className="profile-avatar">{initials}</div>
        <h3 style={{ fontSize: 17, fontWeight: 800 }}>{customer.name}</h3>
        <p className="subtitle">{customer.email}</p>
      </div>

      <div className="stat-row">
        <div className="stat-box card">
          <div className="n">{gamesPlayed}</div>
          <div className="l">Games Played</div>
        </div>
        <div className="stat-box card">
          <div className="n">4.2</div>
          <div className="l">Skill Rating</div>
        </div>
        <div className="stat-box card">
          <div className="n">{upcoming}</div>
          <div className="l">Upcoming</div>
        </div>
      </div>

      <div style={{ height: 14 }} />
      <div className="card" style={{ margin: "0 20px", overflow: "hidden" }}>
        <MenuItem icon="🗓️" label="My Bookings" />
        <MenuItem icon="💳" label="Payment Methods" />
        <MenuItem icon="🏓" label="Skill Level & DUPR" />
        <MenuItem icon="🔔" label="Notifications" />
        <MenuItem icon="⚙️" label="Settings" />
        <MenuItem icon="🔒" label="Privacy Policy" href="/privacy" />
        <MenuItem icon="📄" label="Terms of Service" href="/terms" last />
      </div>
    </>
  );
}

function MenuItem({
  icon,
  label,
  href,
  last,
}: {
  icon: string;
  label: string;
  href?: string;
  last?: boolean;
}) {
  const content = (
    <>
      <div className="ic">{icon}</div>
      <div className="label">{label}</div>
      <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </>
  );
  const style = last ? { borderBottom: "none" } : undefined;
  if (href) {
    return (
      <Link href={href} className="menu-item" style={style}>
        {content}
      </Link>
    );
  }
  return (
    <div className="menu-item" style={style}>
      {content}
    </div>
  );
}
