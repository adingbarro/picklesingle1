"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";

const NAV = [
  {
    href: "/admin",
    label: "General",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/facilities",
    label: "Facilities",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 3 7l9 5 9-5-9-5z" />
        <path d="M3 12l9 5 9-5" />
        <path d="M3 17l9 5 9-5" />
      </svg>
    ),
  },
  {
    href: "/admin/courts",
    label: "Courts & Hours",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/admin/manual-booking",
    label: "Manual Booking",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
];

export default function AdminSidebar({
  companyName,
  logoDataUrl,
}: {
  companyName: string;
  logoDataUrl: string | null;
}) {
  const pathname = usePathname();
  const initial = companyName.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-preview">
          {logoDataUrl ? <img src={logoDataUrl} alt="" /> : initial}
        </div>
        <div>
          <div className="brand-name">{companyName}</div>
          <div className="brand-sub">Admin Panel</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${pathname === item.href ? " active" : ""}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="admin-avatar">A</div>
        <div>
          <div className="who">Admin User</div>
          <div className="role">Owner</div>
        </div>
        <form action={logout}>
          <button type="submit" className="text-btn logout-btn" title="Log out">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
