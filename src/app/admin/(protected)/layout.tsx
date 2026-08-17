import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [settings, pendingBookings] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.booking.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="admin-shell">
      <AdminSidebar
        companyName={settings?.companyName ?? "Pickleball Club"}
        logoDataUrl={settings?.logoDataUrl ?? null}
        pendingBookings={pendingBookings}
      />
      <main className="admin-main">{children}</main>
    </div>
  );
}
