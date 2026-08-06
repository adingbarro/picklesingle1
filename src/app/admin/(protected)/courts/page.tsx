import { prisma } from "@/lib/prisma";
import CourtsManager from "@/components/admin/CourtsManager";

export const dynamic = "force-dynamic";

export default async function AdminCourtsPage() {
  const [courts, settings] = await Promise.all([
    prisma.court.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <CourtsManager
      courts={courts.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        lighted: c.lighted,
        pricePerHour: c.pricePerHour,
        is24Hours: c.is24Hours,
        opensAt: c.opensAt,
        closesAt: c.closesAt,
        status: c.status,
      }))}
      defaultOpen={settings?.defaultOpen ?? "06:00"}
      defaultClose={settings?.defaultClose ?? "22:00"}
    />
  );
}
