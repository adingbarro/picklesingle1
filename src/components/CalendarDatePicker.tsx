"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export default function CalendarDatePicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (dateKey: string) => void;
}) {
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [selYear, selMonth] = selected.split("-").map(Number);
  const [viewYear, setViewYear] = useState(selYear || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selMonth || today.getMonth() + 1); // 1-12
  const [fullyBooked, setFullyBooked] = useState<string[] | null>(null);

  const requestKey = `${viewYear}-${viewMonth}`;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/day-status?year=${viewYear}&month=${viewMonth}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setFullyBooked(data.fullyBooked ?? []);
          setLoadedFor(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth, requestKey]);

  const loading = loadedFor !== requestKey;
  const fullSet = new Set(fullyBooked ?? []);

  const firstDow = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

  const cells: { day: number | null; key: string | null }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: toDateKey(viewYear, viewMonth, d) });

  function goPrevMonth() {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="calendar-nav-btn" onClick={goPrevMonth} aria-label="Previous month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="label">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </div>
        <button type="button" className="calendar-nav-btn" onClick={goNextMonth} aria-label="Next month">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell, i) => {
          if (cell.day === null) {
            return <div key={i} className="cal-day empty" />;
          }
          const isPast = cell.key! < todayKey;
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selected;
          const isFull = !loading && fullSet.has(cell.key!);

          const classes = ["cal-day"];
          if (isPast) classes.push("past");
          if (isToday) classes.push("today");
          if (isSelected) classes.push("selected");
          if (isFull) classes.push("full");

          return (
            <div
              key={i}
              className={classes.join(" ")}
              onClick={() => !isPast && onSelect(cell.key!)}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span className="item">
          <span className="dot" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger)" }} />
          Fully booked
        </span>
      </div>
    </div>
  );
}
