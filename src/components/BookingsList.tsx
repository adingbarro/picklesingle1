"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/app/checkout/actions";
import { peso, timeLabel } from "@/lib/format";

export type BookingRow = {
  id: string;
  courtName: string;
  courtType: "INDOOR" | "OUTDOOR";
  dateKey: string;
  month: string;
  day: number;
  startTime: string;
  endTime: string;
  players: number;
  totalPrice: number;
  status: "CONFIRMED" | "CANCELLED";
  isPast: boolean;
};

const TABS = ["Upcoming", "Past", "Cancelled"] as const;

export default function BookingsList({ bookings }: { bookings: BookingRow[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = bookings.filter((b) => {
    if (tab === "Cancelled") return b.status === "CANCELLED";
    if (tab === "Past") return b.status === "CONFIRMED" && b.isPast;
    return b.status === "CONFIRMED" && !b.isPast;
  });

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelBooking(id);
      router.refresh();
    });
  }

  return (
    <>
      <div className="scroll-x">
        {TABS.map((t) => (
          <div key={t} className={`chip${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />

      {filtered.length === 0 && (
        <div className="px" style={{ color: "var(--ink-soft)", fontSize: 13.5, padding: "20px" }}>
          No {tab.toLowerCase()} bookings.
        </div>
      )}

      {filtered.map((b) => (
        <div className="booking-card card" key={b.id}>
          <div className="booking-date">
            <div className="mon">{b.month}</div>
            <div className="day">{b.day}</div>
          </div>
          <div className="booking-info">
            <div className="court-row">
              <div className="name">
                {b.courtName} · {b.courtType === "INDOOR" ? "Indoor" : "Outdoor"}
              </div>
              {b.status === "CANCELLED" ? (
                <span className="badge red">Cancelled</span>
              ) : b.isPast ? (
                <span className="badge gray">Completed</span>
              ) : (
                <span className="badge lime">Confirmed</span>
              )}
            </div>
            <div className="meta">
              {timeLabel(b.startTime)} – {timeLabel(b.endTime)} · {b.players} players · {peso(b.totalPrice)}
            </div>
            {b.status === "CONFIRMED" && !b.isPast && (
              <div className="booking-actions">
                <div className="mini-btn danger" onClick={() => !pending && handleCancel(b.id)}>
                  {pending ? "Cancelling…" : "Cancel"}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
