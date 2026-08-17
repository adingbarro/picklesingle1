"use server";

import { prisma } from "@/lib/prisma";

export type ContactState = { error: string | null; sent: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 4000;

/** Club-local date for the subject line, e.g. 08172026. */
function todayMMDDYYYY(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")}${get("day")}${get("year")}`;
}

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: "Please fill in your name, email and message.", sent: false };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "That email address doesn't look right.", sent: false };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`, sent: false };
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const apiKey = settings?.brevoApiKey?.trim();
  // From: the sender in Contact Form Settings. To: the company email.
  const sender = settings?.brevoSenderEmail?.trim();
  const recipient = settings?.email?.trim();

  if (!apiKey || !sender || !recipient) {
    return {
      error: "Our contact form isn't set up yet — please message us on Facebook in the meantime.",
      sent: false,
    };
  }

  const companyName = settings?.companyName ?? "Pickleball Club";

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: companyName, email: sender },
        to: [{ email: recipient }],
        // Reply-to is the address the customer typed into the form.
        replyTo: { email, name },
        subject: `Customer Inquiry - ${companyName} ${todayMMDDYYYY()}`,
        // Plain text only — the customer's message is never interpolated into HTML.
        textContent: `From: ${name} <${email}>\n\n${message}`,
      }),
    });

    if (!res.ok) {
      console.error("Brevo send failed", res.status, await res.text());
      return { error: "We couldn't send your message right now. Please try again or message us on Facebook.", sent: false };
    }
  } catch (err) {
    console.error("Brevo send failed", err);
    return { error: "We couldn't send your message right now. Please try again or message us on Facebook.", sent: false };
  }

  return { error: null, sent: true };
}
