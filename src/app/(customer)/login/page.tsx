"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginCustomer, type LoginState } from "@/app/checkout/actions";

const initialState: LoginState = { error: null };

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(loginCustomer, initialState);

  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.push(next);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <div className="top">
        <h1>Sign In</h1>
      </div>
      <div className="px" style={{ marginTop: 6 }}>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16, lineHeight: 1.5 }}>
            Log in to your account to book courts and view your profile.
          </p>
          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
      </div>
    </>
  );
}
