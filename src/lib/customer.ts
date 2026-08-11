import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { auth } from "./auth";
import { CUSTOMER_SESSION_COOKIE, readCustomerSessionEmail } from "./customerAuth";

// Session state can come from either login path: a Google sign-in (Auth.js
// JWT cookie) or the hardcoded email/password login (customer_session
// cookie). Callers that just need "who's logged in" should use this instead
// of reading either cookie directly.
export async function getCurrentCustomerEmail(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.email) return session.user.email;

  const cookieStore = await cookies();
  return readCustomerSessionEmail(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
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
