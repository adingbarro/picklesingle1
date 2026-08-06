import { prisma } from "@/lib/prisma";
import FacilitiesManager from "@/components/admin/FacilitiesManager";

export const dynamic = "force-dynamic";

export default async function AdminFacilitiesPage() {
  const facilities = await prisma.facility.findMany({ orderBy: { sortOrder: "asc" } });

  return <FacilitiesManager facilities={facilities} />;
}
