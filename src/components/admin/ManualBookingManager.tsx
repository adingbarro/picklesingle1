"use client";

import { useEffect, useState, useTransition } from "react";
import { createManualBooking } from "@/app/admin/(protected)/manual-booking/actions";
import { peso, timeLabel } from "@/lib/format";
import { groupContiguousSlots } from "@/lib/slots";

// Slots are picked one hour at a time; contiguous picks are merged into a
// single booking server-side, so there's no separate duration control.
const SLOT_MINUTES = 60;
const MAX_SLOTS = 24;

type Pick = { courtId: string; start: string };

type Slot = { start: string; end: string; available: boolean };
type CourtWithSlots = {
  id: string;
  name: string;
  type: "INDOOR" | "OUTDOOR";
  pricePerHour: number;
  status: "ACTIVE" | "MAINTENANCE";
  is24Hours: boolean;
  slots: Slot[];
};

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ManualBookingManager() {
  const [date, setDate] = useState(todayDateKey());
  const [courts, setCourts] = useState<CourtWithSlots[] | null>(null);
  const [selected, setSelected] = useState<Pick[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [players, setPlayers] = useState(2);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/day-availability?date=${date}&duration=${SLOT_MINUTES}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCourts(data.courts ?? []);
          setLoadedFor(date);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const loading = loadedFor !== date;

  function handleDateChange(v: string) {
    setDate(v);
    setSelected([]);
    setSuccessMsg(null);
  }

  function toggleSlot(courtId: string, start: string) {
    setSelected((prev) => {
      const isPicked = prev.some((p) => p.courtId === courtId && p.start === start);
      if (isPicked) return prev.filter((p) => !(p.courtId === courtId && p.start === start));
      return prev.length >= MAX_SLOTS ? prev : [...prev, { courtId, start }];
    });
    setSuccessMsg(null);
    setError(null);
  }

  // One summary line per court, with contiguous hours shown as a single block —
  // the same way they'll be saved.
  const summary = (courts ?? [])
    .map((court) => {
      const starts = selected.filter((p) => p.courtId === court.id).map((p) => p.start);
      if (starts.length === 0) return null;
      const blocks = groupContiguousSlots(starts);
      return {
        court,
        blocks,
        price: Math.round((court.pricePerHour * starts.length * SLOT_MINUTES) / 60),
      };
    })
    .filter((row) => row !== null);
  const totalPrice = summary.reduce((sum, row) => sum + row.price, 0);

  function handleSubmit() {
    if (selected.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await createManualBooking({
        picks: selected,
        date,
        players,
        customerName,
        customerEmail,
        customerPhone,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      const codes = result?.confirmationCodes ?? [];
      setSuccessMsg(
        codes.length > 1 ? `${codes.length} bookings confirmed — ${codes.join(", ")}` : `Booking confirmed — ${codes[0]}`
      );
      setSelected([]);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setPlayers(2);
      // refetch availability so the just-booked slots show as taken
      fetch(`/api/day-availability?date=${date}&duration=${SLOT_MINUTES}`)
        .then((r) => r.json())
        .then((data) => setCourts(data.courts ?? []));
    });
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Manual Booking</h1>
          <div className="sub">Book a court on behalf of a walk-in or phone customer</div>
        </div>
      </div>

      <div className="admin-content" style={{ paddingBottom: selected.length > 0 ? 140 : 60 }}>
        <div className="card pad">
          <div className="mb-toolbar">
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} />
            </div>
            <p className="mb-empty" style={{ flex: 1, minWidth: 260, margin: 0, paddingBottom: 8 }}>
              Tap one or more hours — contiguous hours become a single booking, gaps become separate ones. You can
              pick across courts for the same customer.
            </p>
          </div>
        </div>

        {successMsg && (
          <div
            className="card"
            style={{
              padding: 14,
              borderColor: "var(--green-600)",
              background: "var(--green-100)",
              color: "var(--green-800)",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        {loading && <p className="mb-empty">Loading availability…</p>}

        {!loading &&
          courts?.map((c) => (
            <div className="card mb-court-block" key={c.id}>
              <div className="mb-court-head">
                <div>
                  <div className="name">
                    {c.name} · {c.type === "INDOOR" ? "Indoor" : "Outdoor"}
                    {c.is24Hours ? " · 24 Hrs" : ""}
                  </div>
                  <div className="meta">{peso(c.pricePerHour)}/hr</div>
                </div>
                {c.status === "MAINTENANCE" && <span className="badge gray">Under maintenance</span>}
              </div>

              {c.status === "MAINTENANCE" ? (
                <p className="mb-empty">Not bookable while under maintenance.</p>
              ) : c.slots.length === 0 ? (
                <p className="mb-empty">No slots available for this date.</p>
              ) : (
                <div className="mb-slot-row">
                  {c.slots.map((s) => {
                    const isSelected = selected.some((p) => p.courtId === c.id && p.start === s.start);
                    const disabled = !s.available || (selected.length >= MAX_SLOTS && !isSelected);
                    return (
                      <div
                        key={s.start}
                        className={`mb-slot${!s.available ? " taken" : ""}${isSelected ? " selected" : ""}`}
                        onClick={() => !disabled && toggleSlot(c.id, s.start)}
                      >
                        {timeLabel(s.start)}
                        <span className="p">{s.available ? peso(c.pricePerHour) : "Booked"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
      </div>

      {selected.length > 0 && (
        <div className="mb-summary-bar">
          <div className="info">
            <div className="t1">
              {summary.map((row) => (
                <div key={row.court.id}>
                  <b style={{ color: "var(--ink)" }}>{row.court.name}</b>{" "}
                  {row.blocks.map((b) => `${timeLabel(b.start)}–${timeLabel(b.end)}`).join(", ")} · {peso(row.price)}
                </div>
              ))}
            </div>
            <div className="t2">
              {selected.length} {selected.length === 1 ? "hr" : "hrs"} · {peso(totalPrice)}
            </div>
            <div className="mb-customer-fields" style={{ marginTop: 8 }}>
              <div className="field">
                <input
                  type="text"
                  placeholder="Customer name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="field">
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="field">
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="field" style={{ flex: "0 0 auto", minWidth: 130 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => setPlayers((p) => Math.max(1, p - 1))}
                  >
                    −
                  </button>
                  <span style={{ fontWeight: 800, minWidth: 16, textAlign: "center" }}>{players}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => setPlayers((p) => Math.min(4, p + 1))}
                  >
                    +
                  </button>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>players</span>
                </div>
              </div>
            </div>
            {error && (
              <div style={{ color: "var(--danger)", fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{error}</div>
            )}
          </div>
          <button className="pill-btn" onClick={handleSubmit} disabled={pending || !customerName.trim()}>
            {pending ? "Booking…" : "Create Booking"}
          </button>
          <button className="pill-btn secondary" onClick={() => setSelected([])} disabled={pending}>
            Clear
          </button>
        </div>
      )}
    </>
  );
}
