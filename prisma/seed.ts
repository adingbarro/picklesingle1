import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const facilities = [
  { key: "lighted", label: "Lighted Courts", icon: "💡", enabled: true, sortOrder: 0 },
  { key: "parking", label: "Free Parking", icon: "🅿️", enabled: true, sortOrder: 1 },
  { key: "restrooms", label: "Restrooms", icon: "🚻", enabled: true, sortOrder: 2 },
  { key: "lockers", label: "Locker Rooms", icon: "🔒", enabled: false, sortOrder: 3 },
  { key: "showers", label: "Showers", icon: "🚿", enabled: true, sortOrder: 4 },
  { key: "proshop", label: "Pro Shop", icon: "🏓", enabled: true, sortOrder: 5 },
  { key: "snackbar", label: "Snack Bar", icon: "🍿", enabled: false, sortOrder: 6 },
  { key: "cafe", label: "Café", icon: "☕", enabled: false, sortOrder: 7 },
  { key: "wifi", label: "Free Wi-Fi", icon: "📶", enabled: true, sortOrder: 8 },
  { key: "vending", label: "Vending Machines", icon: "🥤", enabled: false, sortOrder: 9 },
  { key: "seating", label: "Seating / Bleachers", icon: "💺", enabled: true, sortOrder: 10 },
  { key: "ac", label: "Air Conditioning", icon: "❄️", enabled: false, sortOrder: 11 },
  { key: "firstaid", label: "First Aid Station", icon: "⛑️", enabled: false, sortOrder: 12 },
  { key: "equipment", label: "Equipment Rentals", icon: "🎒", enabled: false, sortOrder: 13 },
];

const courts = [
  { name: "Court 1", type: "INDOOR" as const, lighted: false, pricePerHour: 350, opensAt: "06:00", closesAt: "22:00", status: "ACTIVE" as const, sortOrder: 0 },
  { name: "Court 2", type: "INDOOR" as const, lighted: false, pricePerHour: 350, opensAt: "06:00", closesAt: "22:00", status: "ACTIVE" as const, sortOrder: 1 },
  { name: "Court 3", type: "INDOOR" as const, lighted: false, pricePerHour: 350, opensAt: "06:00", closesAt: "22:00", status: "MAINTENANCE" as const, sortOrder: 2 },
  { name: "Court 4", type: "OUTDOOR" as const, lighted: true, pricePerHour: 250, opensAt: "07:00", closesAt: "21:00", status: "ACTIVE" as const, sortOrder: 3 },
  { name: "Court 5", type: "OUTDOOR" as const, lighted: true, pricePerHour: 250, opensAt: "07:00", closesAt: "21:00", status: "ACTIVE" as const, sortOrder: 4 },
  { name: "Court 6", type: "OUTDOOR" as const, lighted: false, pricePerHour: 250, opensAt: "07:00", closesAt: "21:00", status: "ACTIVE" as const, sortOrder: 5 },
];

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: "Baseline Pickleball Club",
      tagline: "Austin's home for competitive pickleball",
      address: "1420 Maple Ave, Austin, TX",
      phone: "(512) 555-0148",
      email: "hello@baselineclub.com",
      defaultOpen: "06:00",
      defaultClose: "22:00",
    },
  });

  for (const f of facilities) {
    await prisma.facility.upsert({
      where: { key: f.key },
      update: f,
      create: f,
    });
  }

  for (const c of courts) {
    const existing = await prisma.court.findFirst({ where: { name: c.name } });
    if (existing) {
      await prisma.court.update({ where: { id: existing.id }, data: c });
    } else {
      await prisma.court.create({ data: c });
    }
  }

  const demoCustomer = await prisma.customer.upsert({
    where: { email: "jordan.diaz@email.com" },
    update: {},
    create: { name: "Jordan Diaz", email: "jordan.diaz@email.com" },
  });

  console.log("Seeded settings, facilities, courts, and demo customer:", demoCustomer.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
