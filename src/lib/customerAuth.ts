import { createHmac, timingSafeEqual } from "crypto";

export const CUSTOMER_SESSION_COOKIE = "customer_session";
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getCustomerCredentials() {
  const email = process.env.CUSTOMER_EMAIL;
  const password = process.env.CUSTOMER_PASSWORD;
  if (!email || !password) {
    throw new Error("CUSTOMER_EMAIL and CUSTOMER_PASSWORD must be set to use customer login.");
  }
  return { email, password };
}

function getSessionSecret() {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_SESSION_SECRET must be set to use customer login.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function verifyCustomerCredentials(email: string, password: string) {
  const customer = getCustomerCredentials();
  return email.trim().toLowerCase() === customer.email.toLowerCase() && password === customer.password;
}

export function createCustomerSessionCookieValue(email: string) {
  return `${email}.${sign(email)}`;
}

// Signed rather than a bare marker, so the cookie can't be forged by simply
// setting a cookie with the right name — the signature requires the server secret.
// Returns the logged-in customer's email so callers can look up their record.
export function readCustomerSessionEmail(value: string | undefined | null): string | null {
  if (!value) return null;
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const email = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);
  const expected = sign(email);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const customer = getCustomerCredentials();
  if (email.toLowerCase() !== customer.email.toLowerCase()) return null;
  return email;
}
