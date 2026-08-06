"use client";

import { useEffect, useRef } from "react";

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function DateStrip({
  value,
  onChange,
  days = 10,
}: {
  value: string;
  onChange: (dateKey: string) => void;
  days?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const items = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { key: toDateKey(d), dow: DOW[d.getDay()], num: d.getDate() };
  });

  useEffect(() => {
    const activeEl = containerRef.current?.querySelector<HTMLDivElement>(".date-item.active");
    activeEl?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [value]);

  return (
    <div className="scroll-x" ref={containerRef}>
      {items.map((item) => (
        <div
          key={item.key}
          className={`date-item${item.key === value ? " active" : ""}`}
          onClick={() => onChange(item.key)}
        >
          <div className="dow">{item.dow}</div>
          <div className="num">{item.num}</div>
        </div>
      ))}
    </div>
  );
}

export function todayDateKey(): string {
  return toDateKey(new Date());
}
