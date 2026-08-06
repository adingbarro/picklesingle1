"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CalendarDatePicker from "./CalendarDatePicker";
import { peso } from "@/lib/format";

type CourtPreview = {
  id: string;
  name: string;
  type: "INDOOR" | "OUTDOOR";
  pricePerHour: number;
  lighted: boolean;
  is24Hours: boolean;
  status: "ACTIVE" | "MAINTENANCE";
};

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HomeDateAndCourts({ courts }: { courts: CourtPreview[] }) {
  const [selectedDate, setSelectedDate] = useState(todayDateKey());
  const [fullyBookedByCourtId, setFullyBookedByCourtId] = useState<Record<string, boolean>>({});
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/day-availability?date=${selectedDate}&duration=60`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const map: Record<string, boolean> = {};
        for (const c of data.courts ?? []) {
          map[c.id] = c.status === "ACTIVE" && c.slots.length > 0 && c.slots.every((s: { available: boolean }) => !s.available);
        }
        setFullyBookedByCourtId(map);
        setLoadedFor(selectedDate);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const loading = loadedFor !== selectedDate;

  return (
    <>
      <div className="section-head">
        <h3>Select a date</h3>
      </div>
      <CalendarDatePicker selected={selectedDate} onSelect={setSelectedDate} />

      <div className="section-head">
        <h3>Our Courts</h3>
        <Link href="/book" className="link">
          See all
        </Link>
      </div>
      {courts.map((c) => {
        const fullyBooked = !loading && fullyBookedByCourtId[c.id];
        return (
          <Link key={c.id} href={`/courts/${c.id}?date=${selectedDate}`} className="court-card card">
            <div
              className="court-thumb"
              style={{
                backgroundImage:
                  c.type === "INDOOR"
                    ? "linear-gradient(160deg,#1a8a5e,#0b3d2e)"
                    : "linear-gradient(160deg,#3ab07a,#146c4a)",
              }}
            >
              #{c.name.replace(/\D/g, "") || c.name.charAt(0)}
            </div>
            <div className="court-body2">
              <div className="court-row">
                <div>
                  <div className="court-name">{c.name}</div>
                  <div className="court-meta">
                    {c.type === "INDOOR" ? "🏠" : "☀️"} {c.type === "INDOOR" ? "Indoor" : "Outdoor"} ·{" "}
                    {peso(c.pricePerHour)}/hr
                  </div>
                </div>
              </div>
              <div className="court-tags">
                {c.status === "ACTIVE" ? (
                  fullyBooked ? (
                    <span className="badge red">Fully Booked</span>
                  ) : (
                    <span className="badge lime">Available</span>
                  )
                ) : (
                  <span className="badge gray">Under maintenance</span>
                )}
                {c.lighted && <span className="badge green">Lighted</span>}
                {c.is24Hours && <span className="badge green">🌙 24 Hrs</span>}
              </div>
            </div>
            <div className="court-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        );
      })}
    </>
  );
}
