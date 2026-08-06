import { prisma } from "./prisma";

// This app ships without authentication. Every booking is attached to a single
// demo customer so the flow is fully functional end-to-end; swap this for real
// auth (NextAuth, Clerk, etc.) before taking multi-user traffic in production.
const DEMO_EMAIL = "jordan.diaz@email.com";

export async function getDemoCustomer() {
  return prisma.customer.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { name: "Jordan Diaz", email: DEMO_EMAIL },
  });
}

export async function getOrCreateCustomerByEmail(email: string) {
  const name = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return prisma.customer.upsert({
    where: { email },
    update: {},
    create: { name, email },
  });
}
