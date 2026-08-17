"use client";

import { useEffect, useState } from "react";
import { todayManilaDateKey } from "@/lib/format";

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
  courtId,
}: {
  selected: string;
  onSelect: (dateKey: string) => void;
  /** When set, "fully booked" days reflect only this court instead of all courts. */
  courtId?: string;
}) {
  // "Today" is the club's day in Manila, not the viewer's local day.
  const todayKey = todayManilaDateKey();
  const [todayYear, todayMonth] = todayKey.split("-").map(Number);

  const [selYear, selMonth] = selected.split("-").map(Number);
  const [viewYear, setViewYear] = useState(selYear || todayYear);
  const [viewMonth, setViewMonth] = useState(selMonth || todayMonth); // 1-12
  const [dayStatus, setDayStatus] = useState<{ fullyBooked: string[]; partlyBooked: string[] }>({
    fullyBooked: [],
    partlyBooked: [],
  });

  const requestKey = `${viewYear}-${viewMonth}-${courtId ?? "all"}`;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/day-status?year=${viewYear}&month=${viewMonth}${courtId ? `&courtId=${courtId}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setDayStatus({ fullyBooked: data.fullyBooked ?? [], partlyBooked: data.partlyBooked ?? [] });
          setLoadedFor(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [viewYear, viewMonth, courtId, requestKey]);

  const loading = loadedFor !== requestKey;
  const fullSet = new Set(dayStatus.fullyBooked);
  const partlySet = new Set(dayStatus.partlyBooked);

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
          // Past days can't be booked, so they carry no availability state.
          const showStatus = !loading && !isPast;
          const isFull = showStatus && fullSet.has(cell.key!);
          const isPartly = showStatus && partlySet.has(cell.key!);

          const classes = ["cal-day"];
          if (isPast) classes.push("past");
          if (isToday) classes.push("today");
          if (isSelected) classes.push("selected");
          if (isFull) classes.push("full");
          else if (isPartly) classes.push("partly");
          else if (showStatus) classes.push("free");

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
          <span className="dot free" />
          Available
        </span>
        <span className="item">
          <span className="dot partly" />
          Partly booked
        </span>
        <span className="item">
          <span className="dot full" />
          Fully booked
        </span>
      </div>
    </div>
  );
}
