import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LAST_UPDATED = "August 17, 2026";

export default async function PrivacyPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const companyName = settings?.companyName ?? "Baseline Pickleball Club";
  const contactEmail = settings?.email ?? "adsbar0904@gmail.com";

  return (
    <>
      <div className="top">
        <h1>Privacy Policy</h1>
      </div>
      <div className="px" style={{ marginTop: 6, marginBottom: 24 }}>
        <div className="card legal" style={{ padding: 20 }}>
          <p style={{ marginBottom: 18 }}>Last updated: {LAST_UPDATED}</p>

          <h2>Overview</h2>
          <p>
            {companyName} ("we", "us", "our") operates this court booking application (the "App")
            so customers can browse courts, make bookings, and manage their account. This Privacy
            Policy explains what information we collect, how we use it, and — because the App
            offers "Continue with Google" sign-in — specifically how we handle data we receive
            from your Google Account.
          </p>

          <h2>Information We Collect</h2>
          <p>We collect the following categories of information:</p>
          <ul>
            <li>
              <strong>Account information.</strong> When you sign in with email and password, we
              store your email address, an account name, and (if you choose to add one) a phone
              number.
            </li>
            <li>
              <strong>Google Account information.</strong> When you choose "Continue with Google,"
              Google authenticates you and shares basic profile information with us — your email
              address, name, profile picture, and a unique Google account identifier. Of this, we
              retain only <strong>your email address</strong> in our database to identify your
              account and link it to your bookings; your name, profile picture, and Google
              identifier are used only to complete the sign-in and are not stored.
            </li>
            <li>
              <strong>Booking information.</strong> Court, date, time, duration, price, and status
              for each booking you make.
            </li>
          </ul>
          <p>We do not collect payment card details — bookings are paid for at the club in person.</p>

          <h2>How We Use Google User Data</h2>
          <p>
            The only Google user data we access is the basic OAuth profile (email, name, profile
            picture) provided during sign-in, requested solely to authenticate you and create or
            match your customer account by email address. We do not access your Gmail, Drive,
            Calendar, Contacts, or any other Google service or scope beyond basic sign-in profile
            information.
          </p>
          <p>
            <strong>Limited Use disclosure.</strong> Our use and transfer of information received
            from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. Specifically, we do not use Google user data
            for advertising or serve ads of any kind, we do not sell Google user data, we do not
            allow humans to read Google user data except with your consent, for security purposes,
            to comply with applicable law, or for the App's internal operations, and we do not
            transfer Google user data to any third party.
          </p>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To create and maintain your customer account.</li>
            <li>To process, confirm, and manage your court bookings.</li>
            <li>To show you your booking history and profile details within the App.</li>
            <li>To operate, secure, and troubleshoot the App.</li>
          </ul>

          <h2>How We Store and Protect Information</h2>
          <p>
            Your information is stored in a PostgreSQL database hosted on our infrastructure
            provider (Railway) and is accessible only to authorized administrators of the App for
            the purposes described in this policy.
          </p>

          <h2>Sharing of Information</h2>
          <p>
            We do not sell, rent, or share your personal information — including any information
            obtained via Google sign-in — with third parties for marketing or advertising
            purposes. We do not use a third-party payment processor. Information is only disclosed
            if required by law or to protect the rights, safety, or property of {companyName} or
            our customers.
          </p>

          <h2>Data Retention & Deletion</h2>
          <p>
            We retain your account and booking information for as long as your account is active
            or as needed to provide the App's services. You may request deletion of your account
            and associated data at any time by contacting us below; disconnecting Google sign-in
            from your Google Account settings does not delete data already stored in the App — use
            the contact below for that.
          </p>

          <h2>Children's Privacy</h2>
          <p>The App is not directed to children under 13, and we do not knowingly collect information from them.</p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time, including to keep it accurate as
            our use of Google user data or other App features change. Material changes will be
            reflected by updating the "Last updated" date above.
          </p>

          <h2>Contact Us</h2>
          <p>
            Questions about this Privacy Policy or your data, including requests to access or
            delete your information, can be sent to{" "}
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
