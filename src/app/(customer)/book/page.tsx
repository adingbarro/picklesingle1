import { prisma } from "@/lib/prisma";
import CourtListing from "@/components/CourtListing";

export const dynamic = "force-dynamic";

export default async function BookPage() {
  const courts = await prisma.court.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <div className="top">
        <h1>Book a Court</h1>
      </div>
      <CourtListing courts={courts} />
    </>
  );
}
