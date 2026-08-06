import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to use the admin login.");
  }
  return { email, password };
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET must be set to use the admin login.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function verifyCredentials(email: string, password: string) {
  const admin = getAdminCredentials();
  return email.trim().toLowerCase() === admin.email.toLowerCase() && password === admin.password;
}

export function createSessionCookieValue(email: string) {
  return `${email}.${sign(email)}`;
}

// Signed rather than a bare marker, so the cookie can't be forged by simply
// setting a cookie with the right name — the signature requires the server secret.
export function isValidSessionCookieValue(value: string | undefined | null) {
  if (!value) return false;
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const email = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);
  const expected = sign(email);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  return email.toLowerCase() === getAdminCredentials().email.toLowerCase();
}
