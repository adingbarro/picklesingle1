"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="login-shell">
      <form className="login-card" action={formAction}>
        <div className="login-brand">
          <div className="brand-logo-preview">B</div>
          <div>
            <div className="brand-name">Baseline Pickleball Club</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="desc">Enter your admin credentials to continue.</p>

        <div className="field">
          <label>Email</label>
          <input type="email" name="email" required autoFocus autoComplete="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" name="password" required autoComplete="current-password" />
        </div>

        {state.error && <p className="login-error">{state.error}</p>}

        <button type="submit" className="pill-btn block" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
