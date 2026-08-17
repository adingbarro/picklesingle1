"use client";

import { useRef, useState, useTransition } from "react";
import { updateSettings } from "@/app/admin/(protected)/actions";

type Settings = {
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
};

export default function GeneralSettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [savedForm, setSavedForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("logoDataUrl", ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    startTransition(async () => {
      await updateSettings(form);
      setSavedForm(form);
    });
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const initial_char = (form.companyName.trim().charAt(0) || "?").toUpperCase();

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>General Settings</h1>
          <div className="sub">Company name, logo and contact details</div>
        </div>
        <div className="topbar-actions">
          <span className="save-indicator">
            <span className="dot" />
            <span>{isDirty ? "Unsaved changes" : "All changes saved"}</span>
          </span>
          <button className="pill-btn" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="card pad">
          <h3>Company Logo</h3>
          <p className="desc">Shown in the header and booking confirmations of your customer app.</p>
          <div className="logo-upload-row">
            <div className="logo-preview">
              {form.logoDataUrl ? <img src={form.logoDataUrl} alt="" /> : initial_char}
            </div>
            <div>
              <button className="pill-btn secondary" onClick={() => fileInputRef.current?.click()}>
                Upload Logo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLogoChange}
              />
              <div>
                <button className="text-btn" onClick={() => set("logoDataUrl", null)}>
                  Remove logo
                </button>
              </div>
              <p className="hint">Square PNG or JPG recommended, up to 2MB.</p>
            </div>
          </div>
        </div>

        <div className="card pad">
          <h3>Company Details</h3>
          <p className="desc">This information appears throughout the customer booking app.</p>
          <div className="form-grid">
            <div className="field span2">
              <label>Company Name</label>
              <input type="text" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </div>
            <div className="field span2">
              <label>Tagline</label>
              <input type="text" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
            <div className="field span2">
              <label>Address</label>
              <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card pad">
          <h3>Links</h3>
          <p className="desc">
            Shown on the customer home screen — the Facebook icon and the address in the club header link here.
          </p>
          <div className="form-grid">
            <div className="field span2">
              <label>Facebook Page</label>
              <input
                type="url"
                inputMode="url"
                placeholder="https://facebook.com/yourclub"
                value={form.facebookUrl}
                onChange={(e) => set("facebookUrl", e.target.value)}
              />
              <p className="hint">Leave blank to hide the Facebook icon.</p>
            </div>
            <div className="field span2">
              <label>Google Maps Link</label>
              <input
                type="url"
                inputMode="url"
                placeholder="https://maps.app.goo.gl/…"
                value={form.mapsUrl}
                onChange={(e) => set("mapsUrl", e.target.value)}
              />
              <p className="hint">
                Open your club in Google Maps, tap Share, and paste the link. Leave blank and the address stays plain
                text.
              </p>
            </div>
          </div>
        </div>

        <div className="card pad">
          <h3>Messaging</h3>
          <p className="desc">Shown as quick-contact buttons on the customer Contact page. Leave a field blank to hide it.</p>
          <div className="form-grid">
            <div className="field">
              <label>WhatsApp Number</label>
              <input
                type="tel"
                placeholder="+63 912 345 6789"
                value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Telegram Username</label>
              <input
                type="text"
                placeholder="@yourclub"
                value={form.telegramUsername}
                onChange={(e) => set("telegramUsername", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Viber</label>
              <input
                type="tel"
                placeholder="+63 912 345 6789"
                value={form.viberNumber}
                onChange={(e) => set("viberNumber", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card pad">
          <h3>Contact Form Settings</h3>
          <p className="desc">
            Contact form messages are emailed through Brevo. Without both fields the form tells customers to message
            your Facebook page instead.
          </p>
          <div className="form-grid">
            <div className="field span2">
              <label>Brevo API Key</label>
              <input
                type="password"
                autoComplete="off"
                placeholder="xkeysib-…"
                value={form.brevoApiKey}
                onChange={(e) => set("brevoApiKey", e.target.value)}
              />
              <p className="hint">From Brevo → SMTP &amp; API → API Keys.</p>
            </div>
            <div className="field span2">
              <label>Sender</label>
              <input
                type="email"
                placeholder="noreply@yourclub.com"
                value={form.brevoSenderEmail}
                onChange={(e) => set("brevoSenderEmail", e.target.value)}
              />
              <p className="hint">
                Must be a verified sender in Brevo. Messages are delivered to your company email
                {form.email ? ` (${form.email})` : " — set one under Company Details"}, with the customer&apos;s address
                as reply-to.
              </p>
            </div>
          </div>
        </div>

        <div className="card pad">
          <h3>Default Facility Hours</h3>
          <p className="desc">Used as the default opening hours when adding a new court. Each court can override these.</p>
          <div className="form-grid">
            <div className="field">
              <label>Opens</label>
              <input type="time" value={form.defaultOpen} onChange={(e) => set("defaultOpen", e.target.value)} />
            </div>
            <div className="field">
              <label>Closes</label>
              <input type="time" value={form.defaultClose} onChange={(e) => set("defaultClose", e.target.value)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
