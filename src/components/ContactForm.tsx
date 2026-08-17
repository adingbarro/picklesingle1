"use client";

import { useActionState } from "react";
import { sendContactMessage, type ContactState } from "@/app/(customer)/contact/actions";

const initialState: ContactState = { error: null, sent: false };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);

  if (state.sent) {
    return (
      <div className="px">
        <div className="card contact-sent">
          <div className="ic">✓</div>
          <div>
            <div className="t1">Message sent</div>
            <div className="t2">Thanks for reaching out — we&apos;ll reply to your email shortly.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="px contact-form">
      <div className="card pad">
        <div className="field">
          <label htmlFor="contact-name">Name</label>
          <input id="contact-name" name="name" type="text" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="contact-message">Message</label>
          <textarea id="contact-message" name="message" rows={5} required maxLength={4000} />
        </div>

        {state.error && <p className="login-error">{state.error}</p>}

        <button type="submit" className="pill-btn block" disabled={pending}>
          {pending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}
