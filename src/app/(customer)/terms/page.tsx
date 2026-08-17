import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LAST_UPDATED = "August 17, 2026";

export default async function TermsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const companyName = settings?.companyName ?? "Baseline Pickleball Club";
  const contactEmail = settings?.email ?? "adsbar0904@gmail.com";
  const address = settings?.address;

  return (
    <>
      <div className="top">
        <h1>Terms of Service</h1>
      </div>
      <div className="px" style={{ marginTop: 6, marginBottom: 24 }}>
        <div className="card legal" style={{ padding: 20 }}>
          <p style={{ marginBottom: 18 }}>Last updated: {LAST_UPDATED}</p>

          <h2>Agreement to Terms</h2>
          <p>
            These Terms of Service ("Terms") govern your use of this court booking application
            (the "App"), operated by {companyName} ("we", "us", "our")
            {address ? ` at ${address}` : ""}. By creating an account, signing in, or booking a
            court through the App, you agree to these Terms. If you do not agree, please do not
            use the App. See also our{" "}
            <Link href="/privacy" style={{ textDecoration: "underline" }}>
              Privacy Policy
            </Link>
            , which explains how we handle your information.
          </p>

          <h2>Accounts</h2>
          <p>
            You may sign in with an email and password or with "Continue with Google." You are
            responsible for keeping your login credentials secure and for all activity that
            occurs under your account. Provide accurate information when booking, since we use it
            to identify you at the club and to contact you about your reservation.
          </p>

          <h2>Bookings</h2>
          <ul>
            <li>Bookings are subject to court availability at the time you complete checkout.</li>
            <li>
              Prices shown at checkout are in Philippine pesos (₱) and reflect the court's hourly
              rate for the selected duration.
            </li>
            <li>
              <strong>Payment is made at the club</strong> — the App does not process online
              payments or store payment card details.
            </li>
            <li>
              We may cancel or reschedule a booking if a court becomes unavailable (e.g. for
              maintenance) and will make reasonable efforts to notify you.
            </li>
          </ul>

          <h2>Cancellations & No-Shows</h2>
          <p>
            To cancel or change a booking, contact us using the details below or, if available,
            through your booking history in the App. Repeated no-shows or late cancellations may
            result in restrictions on future bookings.
          </p>

          <h2>Acceptable Use</h2>
          <p>
            You agree not to misuse the App — including attempting to access other users'
            accounts or data, disrupting the App's operation, or booking courts with false
            information. We may suspend or terminate accounts that violate these Terms.
          </p>

          <h2>Facilities & Conduct on Premises</h2>
          <p>
            Use of the courts and facilities is subject to the club's on-site rules and staff
            instructions. {companyName} is not responsible for personal injury, loss, or damage
            to personal property arising from use of the courts or facilities, except where
            caused by our negligence and to the extent not limited by applicable law.
          </p>

          <h2>Disclaimer & Limitation of Liability</h2>
          <p>
            The App is provided "as is" without warranties of any kind. To the fullest extent
            permitted by law, {companyName} is not liable for indirect, incidental, or
            consequential damages arising from your use of the App or your visit to the club.
          </p>

          <h2>Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time as the App's features change. Material
            changes will be reflected by updating the "Last updated" date above; continued use of
            the App after changes take effect means you accept the updated Terms.
          </p>

          <h2>Contact Us</h2>
          <p>
            Questions about these Terms can be sent to{" "}
            <a href={`mailto:${contactEmail}`} style={{ textDecoration: "underline" }}>
              {contactEmail}
            </a>
            .
          </p>
        </div>
        <Link href="/" className="privacy-footer-link">
          ← Back to Home
        </Link>
      </div>
    </>
  );
}
