import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CourtBooking from "@/components/CourtBooking";

export const dynamic = "force-dynamic";

export default async function CourtDetailPage({ params, searchParams }: PageProps<"/courts/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const dateParam = typeof sp.date === "string" ? sp.date : undefined;
  const [court, facilities] = await Promise.all([
    prisma.court.findUnique({ where: { id } }),
    prisma.facility.findMany({ where: { enabled: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!court) notFound();

  return (
    <div className="app-shell" style={{ paddingBottom: 0 }}>
      <CourtBooking court={court} facilities={facilities} initialDate={dateParam} />
    </div>
  );
}
