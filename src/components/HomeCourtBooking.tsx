"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CalendarDatePicker from "./CalendarDatePicker";
import { peso, timeLabel, todayManilaDateKey } from "@/lib/format";

type CourtPreview = {
  id: string;
  name: string;
  type: "INDOOR" | "OUTDOOR";
  pricePerHour: number;
  lighted: boolean;
  is24Hours: boolean;
  status: "ACTIVE" | "MAINTENANCE";
};

type Slot = { start: string; end: string; available: boolean };

// Hours are picked one at a time and can be combined; the server merges
// contiguous picks into a single booking.
const DURATION = 60;
const MAX_SLOTS = 12;

export default function HomeCourtBooking({ courts }: { courts: CourtPreview[] }) {
  const router = useRouter();
  const stripRef = useRef<HTMLDivElement>(null);
  const [courtId, setCourtId] = useState(courts[0]?.id ?? null);
  const [selectedDate, setSelectedDate] = useState(todayManilaDateKey());
  const [selected, setSelected] = useState<string[]>([]);
  const [slotsFor, setSlotsFor] = useState<{ key: string; slots: Slot[] } | null>(null);

  const court = courts.find((c) => c.id === courtId) ?? null;
  const requestKey = `${courtId}|${selectedDate}`;

  useEffect(() => {
    if (!courtId) return;
    let cancelled = false;
    fetch(`/api/availability?courtId=${courtId}&date=${selectedDate}&duration=${DURATION}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlotsFor({ key: requestKey, slots: data.slots ?? [] });
      });
    return () => {
      cancelled = true;
    };
  }, [courtId, selectedDate, requestKey]);

  useEffect(() => {
    const activeEl = stripRef.current?.querySelector<HTMLDivElement>(".court-chip.active");
    activeEl?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [courtId]);

  const loading = slotsFor?.key !== requestKey;
  const slots = loading ? [] : slotsFor!.slots;
  const availableCount = slots.filter((s) => s.available).length;
  const priceForSlot = court ? Math.round((court.pricePerHour * DURATION) / 60) : 0;
  const total = selected.length * priceForSlot;
  const atLimit = selected.length >= MAX_SLOTS;

  function pickCourt(id: string) {
    setCourtId(id);
    setSelected([]);
  }

  function pickDate(dateKey: string) {
    setSelectedDate(dateKey);
    setSelected([]);
  }

  function toggleSlot(start: string) {
    setSelected((prev) =>
      prev.includes(start) ? prev.filter((s) => s !== start) : prev.length >= MAX_SLOTS ? prev : [...prev, start]
    );
  }

  function handleContinue() {
    if (!courtId || selected.length === 0) return;
    const params = new URLSearchParams({
      courtId,
      date: selectedDate,
      starts: [...selected].sort().join(","),
    });
    router.push(`/checkout?${params.toString()}`);
  }

  if (courts.length === 0) return null;

  return (
    <>
      <div className="section-head">
        <h3>Our Courts</h3>
      </div>
      {/* Courts fill the row: 1 court = full width, up to 4 across; beyond that
          the row scrolls, still showing 4 at a time. */}
      <div
        className="scroll-x court-slider"
        ref={stripRef}
        style={{ "--court-cols": Math.min(courts.length, 4) } as React.CSSProperties}
      >
        {courts.map((c) => (
          <div
            key={c.id}
            className={`court-chip${c.id === courtId ? " active" : ""}`}
            onClick={() => pickCourt(c.id)}
          >
            <div className="cc-name">{c.name}</div>
            <div className="cc-meta">
              {c.status === "MAINTENANCE"
                ? "Maintenance"
                : `${c.type === "INDOOR" ? "🏠" : "☀️"} ${peso(c.pricePerHour)}/hr`}
            </div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>Select a date</h3>
      </div>
      <CalendarDatePicker selected={selectedDate} onSelect={pickDate} courtId={courtId ?? undefined} />

      <div className="section-head">
        <h3>Available Times</h3>
        <span className="link">{loading ? "…" : `${availableCount} of ${slots.length} free`}</span>
      </div>
      <p className="slot-hint">Tap one or more hours — they don&apos;t have to be back to back.</p>
      <div className="slot-grid">
        {court?.status === "MAINTENANCE" ? (
          <div className="slot-note">This court is currently under maintenance and not bookable.</div>
        ) : loading ? (
          <div className="slot-note">Loading times…</div>
        ) : slots.length === 0 ? (
          <div className="slot-note">No slots available for this date.</div>
        ) : (
          slots.map((s) => {
            const isSelected = selected.includes(s.start);
            const disabled = !s.available || (atLimit && !isSelected);
            return (
              <div
                key={s.start}
                className={`slot${!s.available ? " taken" : ""}${isSelected ? " selected" : ""}`}
                onClick={() => !disabled && toggleSlot(s.start)}
              >
                <span className="t">{timeLabel(s.start)}</span>
                <span className="p">{s.available ? peso(priceForSlot) : "Booked"}</span>
              </div>
            );
          })
        )}
      </div>

      {selected.length > 0 && (
        <>
          {/* Spacer so the last slots aren't hidden behind the fixed bar. */}
          <div style={{ height: 78 }} />
          <div className="selection-bar">
            <div className="total">
              <div className="t1">
                {selected.length} {selected.length === 1 ? "hr" : "hrs"} selected
              </div>
              <div className="t2">{peso(total)}</div>
            </div>
            <button type="button" className="pill-btn" onClick={handleContinue}>
              Continue
            </button>
          </div>
        </>
      )}
    </>
  );
}
