"use client";

import { useEffect, useRef } from "react";
import { addDaysToDateKey, dateKeyWeekday, todayManilaDateKey } from "@/lib/format";

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

  // Days run from the club's today (Manila), not the viewer's local today.
  const items = Array.from({ length: days }, (_, i) => {
    const key = addDaysToDateKey(todayManilaDateKey(), i);
    return { key, dow: DOW[dateKeyWeekday(key)], num: Number(key.slice(8, 10)) };
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
  return todayManilaDateKey();
}
