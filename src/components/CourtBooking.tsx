"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DateStrip, { todayDateKey } from "./DateStrip";
import { peso, timeLabel } from "@/lib/format";

type Slot = { start: string; end: string; available: boolean };

type Facility = { id: string; label: string; icon: string };

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00.000Z`).getTime();
  const to = new Date(`${toKey}T00:00:00.000Z`).getTime();
  return Math.round((to - from) / 86400000);
}

export default function CourtBooking({
  court,
  facilities,
  initialDate,
}: {
  court: {
    id: string;
    name: string;
    type: "INDOOR" | "OUTDOOR";
    lighted: boolean;
    pricePerHour: number;
    is24Hours: boolean;
    status: "ACTIVE" | "MAINTENANCE";
  };
  facilities: Facility[];
  initialDate?: string;
}) {
  const router = useRouter();
  const today = todayDateKey();
  const validInitialDate = initialDate && DATE_KEY_RE.test(initialDate) && initialDate >= today ? initialDate : today;
  const [date, setDate] = useState(validInitialDate);
  const [duration, setDuration] = useState(60);
  const [selected, setSelected] = useState<string | null>(null);
  const [slotsFor, setSlotsFor] = useState<{ key: string; slots: Slot[] } | null>(null);

  // Make sure the date strip's window is wide enough to actually show the
  // pre-selected date (e.g. one picked from the homepage calendar), not just
  // the default 10-day rolling window from today.
  const dateStripDays = Math.max(10, daysBetween(today, validInitialDate) + 3);

  const requestKey = `${court.id}|${date}|${duration}`;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/availability?courtId=${court.id}&date=${date}&duration=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setSlotsFor({ key: requestKey, slots: data.slots ?? [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [court.id, date, duration, requestKey]);

  const loading = slotsFor?.key !== requestKey;
  const slots = loading ? [] : slotsFor!.slots;
  const priceForSlot = Math.round((court.pricePerHour * duration) / 60);
  const availableCount = slots.filter((s) => s.available).length;

  function handleDateChange(newDate: string) {
    setDate(newDate);
    setSelected(null);
  }

  function handleDurationChange(newDuration: number) {
    setDuration(newDuration);
    setSelected(null);
  }

  function handleContinue() {
    if (!selected) return;
    const params = new URLSearchParams({
      courtId: court.id,
      date,
      start: selected,
      duration: String(duration),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <>
      <div
        className="hero"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(11,61,46,0.15) 0%, rgba(9,46,34,0.55) 100%), url('/picklecourt.jpg')",
        }}
      >
        <div className="back-btn" onClick={() => router.push("/book")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
        <div className="big-num">{court.name.replace(/\D/g, "") || court.name.charAt(0)}</div>
      </div>

      <div className="sheet">
        <div className="court-row">
          <div>
            <div className="detail-title">{court.name}</div>
            <div className="detail-meta">
              <span className="item">
                {court.type === "INDOOR" ? "🏠" : "☀️"} {court.type === "INDOOR" ? "Indoor" : "Outdoor"}
              </span>
              <span className="item">{peso(court.pricePerHour)}/hr</span>
              {court.is24Hours && <span className="badge green">🌙 Open 24 Hours</span>}
              {court.status === "MAINTENANCE" && <span className="badge gray">Under maintenance</span>}
            </div>
          </div>
        </div>

        {facilities.length > 0 && (
          <div className="amenities">
            {facilities.slice(0, 6).map((f) => (
              <div className="amenity" key={f.id}>
                <div className="ic">{f.icon}</div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="section-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h3>Select Date</h3>
        </div>
        <div style={{ marginLeft: -20, marginRight: -20 }}>
          <DateStrip value={date} onChange={handleDateChange} days={dateStripDays} />
        </div>

        <div className="section-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h3>Duration</h3>
        </div>
        <div className="duration-row" style={{ paddingLeft: 0, paddingRight: 0 }}>
          {[60, 120].map((d) => (
            <div
              key={d}
              className={`dur-chip${duration === d ? " active" : ""}`}
              onClick={() => handleDurationChange(d)}
            >
              {d} min
            </div>
          ))}
        </div>

        <div className="section-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <h3>Available Times</h3>
          <span className="link">{loading ? "…" : `${availableCount} slots`}</span>
        </div>
        <div className="slot-grid" style={{ paddingLeft: 0, paddingRight: 0 }}>
          {court.status === "MAINTENANCE" ? (
            <div style={{ gridColumn: "1 / -1", color: "var(--ink-soft)", fontSize: 13 }}>
              This court is currently under maintenance and not bookable.
            </div>
          ) : loading ? (
            <div style={{ gridColumn: "1 / -1", color: "var(--ink-soft)", fontSize: 13 }}>Loading times…</div>
          ) : slots.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", color: "var(--ink-soft)", fontSize: 13 }}>
              No slots available for this date/duration.
            </div>
          ) : (
            slots.map((s) => (
              <div
                key={s.start}
                className={`slot${!s.available ? " taken" : ""}${selected === s.start ? " selected" : ""}`}
                onClick={() => s.available && setSelected(s.start)}
              >
                <span className="t">{timeLabel(s.start)}</span>
                <span className="p">{peso(priceForSlot)}</span>
              </div>
            ))
          )}
        </div>

        <div className="sticky-bar" style={{ margin: "10px -20px -8px" }}>
          <div className="total">
            <div className="t1">Selected</div>
            <div className="t2">{selected ? `${timeLabel(selected)} · ${duration} min` : "Choose a time"}</div>
          </div>
          <button className="pill-btn" disabled={!selected} onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </>
  );
}
