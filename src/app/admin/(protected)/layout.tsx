import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <div className="admin-shell">
      <AdminSidebar
        companyName={settings?.companyName ?? "Pickleball Club"}
        logoDataUrl={settings?.logoDataUrl ?? null}
      />
      <main className="admin-main">{children}</main>
    </div>
  );
}
