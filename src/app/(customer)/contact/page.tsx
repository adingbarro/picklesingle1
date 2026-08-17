import { prisma } from "@/lib/prisma";
import { safeExternalUrl } from "@/lib/format";
import ContactForm from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  const companyName = settings?.companyName ?? "Pickleball Club";
  const facebookUrl = safeExternalUrl(settings?.facebookUrl);

  // Only the channels that are actually filled in on /admin show up here.
  const channels = [
    phoneLink(settings?.phone),
    whatsappLink(settings?.whatsappNumber),
    telegramLink(settings?.telegramUsername),
    viberLink(settings?.viberNumber),
  ].filter((c) => c !== null);

  return (
    <>
      <div className="top">
        <h1>Contact Us</h1>
      </div>

      <div className="px">
        <p className="contact-intro">
          {facebookUrl ? (
            <>
              For a faster reply, message us on our{" "}
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                Facebook page
              </a>
              . Otherwise, leave us a message below and we&apos;ll get back to you by email.
            </>
          ) : (
            <>Leave us a message below and we&apos;ll get back to you by email.</>
          )}
        </p>
      </div>

      {channels.length > 0 && (
        <>
          <div className="section-head">
            <h3>Reach us directly</h3>
          </div>
          <div className="px contact-channels">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="contact-channel card"
              >
                <span className="ic">{c.icon}</span>
                <span>
                  <span className="t1">{c.label}</span>
                  <span className="t2">{c.value}</span>
                </span>
              </a>
            ))}
          </div>
        </>
      )}

      <div className="section-head">
        <h3>Send a message</h3>
      </div>
      <ContactForm />

      <p className="privacy-notice">
        {companyName} only uses what you send here to reply to your enquiry.
      </p>
    </>
  );
}

type Channel = { label: string; value: string; icon: string; href: string; external?: boolean };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function phoneLink(phone: string | null | undefined): Channel | null {
  const value = phone?.trim();
  if (!value) return null;
  return { label: "Call us", value, icon: "📱", href: `tel:${value.replace(/[^\d+]/g, "")}` };
}

function whatsappLink(number: string | null | undefined): Channel | null {
  const digits = digitsOnly(number?.trim() ?? "");
  if (!digits) return null;
  return { label: "WhatsApp", value: number!.trim(), icon: "💬", href: `https://wa.me/${digits}`, external: true };
}

function telegramLink(username: string | null | undefined): Channel | null {
  // Accept "@name", "name", or a pasted t.me link.
  const handle = (username ?? "").trim().replace(/^@/, "").replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "");
  if (!handle) return null;
  return { label: "Telegram", value: `@${handle}`, icon: "✈️", href: `https://t.me/${handle}`, external: true };
}

function viberLink(number: string | null | undefined): Channel | null {
  const digits = digitsOnly(number?.trim() ?? "");
  if (!digits) return null;
  // Viber's deep link opens the app on a phone; it does nothing on desktop.
  return { label: "Viber", value: number!.trim(), icon: "📞", href: `viber://chat?number=%2B${digits}`, external: true };
}
