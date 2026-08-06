"use client";

import { useEffect, useState, useTransition } from "react";
import { createManualBooking } from "@/app/admin/(protected)/manual-booking/actions";
import { peso, timeLabel } from "@/lib/format";

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
  const [duration, setDuration] = useState(60);
  const [courts, setCourts] = useState<CourtWithSlots[] | null>(null);
  const [selected, setSelected] = useState<{ courtId: string; start: string } | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [players, setPlayers] = useState(2);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const requestKey = `${date}|${duration}`;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/day-availability?date=${date}&duration=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCourts(data.courts ?? []);
          setLoadedFor(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [date, duration, requestKey]);

  const loading = loadedFor !== requestKey;

  function handleDateChange(v: string) {
    setDate(v);
    setSelected(null);
    setSuccessMsg(null);
  }

  function handleDurationChange(v: number) {
    setDuration(v);
    setSelected(null);
    setSuccessMsg(null);
  }

  function selectSlot(courtId: string, start: string) {
    setSelected({ courtId, start });
    setSuccessMsg(null);
    setError(null);
  }

  const selectedCourt = courts?.find((c) => c.id === selected?.courtId) ?? null;
  const price = selectedCourt ? Math.round((selectedCourt.pricePerHour * duration) / 60) : 0;

  function handleSubmit() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await createManualBooking({
        courtId: selected.courtId,
        date,
        start: selected.start,
        duration,
        players,
        customerName,
        customerEmail,
        customerPhone,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccessMsg(`Booking confirmed — ${result?.confirmationCode}`);
      setSelected(null);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setPlayers(2);
      // refetch availability so the just-booked slot shows as taken
      fetch(`/api/day-availability?date=${date}&duration=${duration}`)
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

      <div className="admin-content" style={{ paddingBottom: selected ? 140 : 60 }}>
        <div className="card pad">
          <div className="mb-toolbar">
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => handleDateChange(e.target.value)} />
            </div>
            <div className="field">
              <label>Duration</label>
              <div className="segmented" style={{ width: 180 }}>
                <button
                  type="button"
                  className={`seg-btn${duration === 60 ? " active" : ""}`}
                  onClick={() => handleDurationChange(60)}
                >
                  60 min
                </button>
                <button
                  type="button"
                  className={`seg-btn${duration === 120 ? " active" : ""}`}
                  onClick={() => handleDurationChange(120)}
                >
                  120 min
                </button>
              </div>
            </div>
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
                <p className="mb-empty">No slots available for this date/duration.</p>
              ) : (
                <div className="mb-slot-row">
                  {c.slots.map((s) => (
                    <div
                      key={s.start}
                      className={`mb-slot${!s.available ? " taken" : ""}${
                        selected?.courtId === c.id && selected.start === s.start ? " selected" : ""
                      }`}
                      onClick={() => s.available && selectSlot(c.id, s.start)}
                    >
                      {timeLabel(s.start)}
                      <span className="p">{peso(Math.round((c.pricePerHour * duration) / 60))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {selected && selectedCourt && (
        <div className="mb-summary-bar">
          <div className="info">
            <div className="t1">
              {selectedCourt.name} · {timeLabel(selected.start)} · {duration} min · {peso(price)}
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
          <button className="pill-btn secondary" onClick={() => setSelected(null)} disabled={pending}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
