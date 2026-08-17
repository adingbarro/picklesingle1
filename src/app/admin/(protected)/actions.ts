"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateSettings(data: {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  facebookUrl: string;
  mapsUrl: string;
  whatsappNumber: string;
  telegramUsername: string;
  viberNumber: string;
  brevoApiKey: string;
  brevoSenderEmail: string;
  logoDataUrl: string | null;
  defaultOpen: string;
  defaultClose: string;
}) {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin");
}

export async function toggleFacility(id: string, enabled: boolean) {
  await prisma.facility.update({ where: { id }, data: { enabled } });
  revalidatePath("/", "layout");
}

export async function addFacility(label: string) {
  const count = await prisma.facility.count();
  await prisma.facility.create({
    data: { key: `custom-${Date.now()}`, label, icon: "⭐", enabled: true, sortOrder: count },
  });
  revalidatePath("/", "layout");
}

export async function removeFacility(id: string) {
  await prisma.facility.delete({ where: { id } });
  revalidatePath("/", "layout");
}

export type CourtInput = {
  id: string; // "new-<n>" for not-yet-persisted rows
  name: string;
  type: "INDOOR" | "OUTDOOR";
  lighted: boolean;
  pricePerHour: number;
  is24Hours: boolean;
  opensAt: string;
  closesAt: string;
  status: "ACTIVE" | "MAINTENANCE";
};

export async function saveCourts(courts: CourtInput[]) {
  const existing = await prisma.court.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((c) => c.id));
  const keepIds = new Set(courts.filter((c) => !c.id.startsWith("new-")).map((c) => c.id));

  const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
  if (toDelete.length > 0) {
    await prisma.booking.deleteMany({ where: { courtId: { in: toDelete } } });
    await prisma.court.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (let i = 0; i < courts.length; i++) {
    const c = courts[i];
    const data = {
      name: c.name,
      type: c.type,
      lighted: c.lighted,
      pricePerHour: c.pricePerHour,
      is24Hours: c.is24Hours,
      opensAt: c.opensAt,
      closesAt: c.closesAt,
      status: c.status,
      sortOrder: i,
    };
    if (c.id.startsWith("new-")) {
      await prisma.court.create({ data });
    } else {
      await prisma.court.update({ where: { id: c.id }, data });
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/courts");
}
