"use client";

import { useState } from "react";
import Link from "next/link";
import { peso } from "@/lib/format";

type CourtRow = {
  id: string;
  name: string;
  type: "INDOOR" | "OUTDOOR";
  lighted: boolean;
  pricePerHour: number;
  is24Hours: boolean;
  status: "ACTIVE" | "MAINTENANCE";
};

const FILTERS = [
  { key: "all", label: "All Courts" },
  { key: "indoor", label: "Indoor" },
  { key: "outdoor", label: "Outdoor" },
  { key: "available", label: "Available Now" },
] as const;

export default function CourtListing({ courts }: { courts: CourtRow[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = courts.filter((c) => {
    if (filter === "indoor") return c.type === "INDOOR";
    if (filter === "outdoor") return c.type === "OUTDOOR";
    if (filter === "available") return c.status === "ACTIVE";
    return true;
  });

  return (
    <>
      <div className="scroll-x">
        {FILTERS.map((f) => (
          <div
            key={f.key}
            className={`chip${filter === f.key ? " active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </div>
        ))}
      </div>

      <div className="section-head">
        <h3>{filtered.length} courts</h3>
      </div>

      {filtered.map((c) => (
        <Link key={c.id} href={`/courts/${c.id}`} className="court-card card">
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
                <span className="badge lime">Available</span>
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
      ))}
    </>
  );
}
