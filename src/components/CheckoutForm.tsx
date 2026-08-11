"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createBooking, loginCustomer, type LoginState } from "@/app/checkout/actions";
import { signInWithGoogle } from "@/lib/authActions";
import { peso } from "@/lib/format";

const initialLoginState: LoginState = { error: null };

export default function CheckoutForm({
  courtId,
  date,
  start,
  duration,
  courtPrice,
  serviceFee,
  isLoggedIn,
}: {
  courtId: string;
  date: string;
  start: string;
  duration: number;
  courtPrice: number;
  serviceFee: number;
  isLoggedIn: boolean;
}) {
  const [players, setPlayers] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showLogin, setShowLogin] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(loginCustomer, initialLoginState);
  const total = courtPrice + serviceFee;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}?${searchParams.toString()}`;

  function submitBooking() {
    setError(null);
    startTransition(async () => {
      const result = await createBooking({ courtId, date, start, duration, players });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleBookNowClick() {
    if (isLoggedIn) {
      submitBooking();
    } else {
      setShowLogin(true);
    }
  }

  // A successful login submit produces a fresh { error: null } state object,
  // distinct by reference from initialLoginState — use that to detect success
  // and continue straight into the booking the user was trying to make.
  useEffect(() => {
    if (loginState !== initialLoginState && loginState.error === null) {
      setShowLogin(false);
      submitBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginState]);

  return (
    <>
      <div className="section-head">
        <h3>Players</h3>
      </div>
      <div className="px">
        <div
          className="card"
          style={{ padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Number of players</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="icon-btn"
              style={{ width: 32, height: 32 }}
              onClick={() => setPlayers((p) => Math.max(2, p - 1))}
            >
              −
            </div>
            <span style={{ fontWeight: 800, minWidth: 14, textAlign: "center" }}>{players}</span>
            <div
              className="icon-btn"
              style={{ width: 32, height: 32 }}
              onClick={() => setPlayers((p) => Math.min(4, p + 1))}
            >
              +
            </div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h3>Payment Method</h3>
      </div>
      <div className="px">
        <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--green-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            💳
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Pay at the club</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Settle payment on arrival</div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h3>Order Summary</h3>
      </div>
      <div className="px">
        <div className="card" style={{ padding: 16 }}>
          <div className="ticket" style={{ padding: 0 }}>
            <div className="row">
              <span>Court rental ({duration} min)</span>
              <span>{peso(courtPrice)}</span>
            </div>
            <div className="row">
              <span>Service fee</span>
              <span>{peso(serviceFee)}</span>
            </div>
            <hr />
            <div className="row">
              <span style={{ color: "var(--ink)", fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: 15.5 }}>{peso(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px">
          <div
            className="card"
            style={{ padding: 14, borderColor: "var(--danger-bg)", background: "var(--danger-bg)", color: "var(--danger)", fontSize: 13, fontWeight: 600 }}
          >
            {error}
          </div>
        </div>
      )}

      <div style={{ height: 6 }} />

      <div className="sticky-bar">
        <div className="total">
          <div className="t1">Total due today</div>
          <div className="t2">{peso(total)}</div>
        </div>
        <button className="pill-btn" onClick={handleBookNowClick} disabled={pending}>
          {pending ? "Booking…" : "Book Now"}
        </button>
      </div>

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Sign in to book</h3>
            <p>Log in to your account to complete this booking.</p>
            <form action={loginAction} className="modal-form">
              <div className="field">
                <label>Email</label>
                <input type="email" name="email" required autoFocus autoComplete="username" />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" name="password" required autoComplete="current-password" />
              </div>
              {loginState.error && <p className="login-error">{loginState.error}</p>}
              <div className="modal-actions">
                <button type="button" className="pill-btn secondary" onClick={() => setShowLogin(false)}>
                  Cancel
                </button>
                <button type="submit" className="pill-btn" disabled={loginPending}>
                  {loginPending ? "Signing in…" : "Sign In"}
                </button>
              </div>
            </form>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--line)" }} />
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>or</span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--line)" }} />
            </div>
            <form action={signInWithGoogle.bind(null, currentUrl)}>
              <button type="submit" className="pill-btn secondary block">
                Continue with Google
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
