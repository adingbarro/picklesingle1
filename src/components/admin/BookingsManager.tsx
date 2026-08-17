"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveBooking,
  declineBooking,
  cancelBookingAsAdmin,
} from "@/app/admin/(protected)/bookings/actions";
import { peso, timeLabel } from "@/lib/format";
import { BOOKING_STATUS_BADGE, BOOKING_STATUS_LABELS } from "@/lib/bookingStatus";
import type { BookingStatus } from "@/generated/prisma/enums";

export type StatusFilter = BookingStatus | "ALL";

export type AdminBookingRow = {
  id: string;
  confirmationCode: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  courtName: string;
  courtType: "INDOOR" | "OUTDOOR";
  dateLabel: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  players: number;
  totalPrice: number;
  status: BookingStatus;
  isPast: boolean;
};

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "DECLINED", label: "Declined" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "ALL", label: "All" },
];

export default function BookingsManager({
  rows,
  filter,
  counts,
}: {
  rows: AdminBookingRow[];
  filter: StatusFilter;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, action: (id: string) => Promise<{ error: string } | { success: true }>) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await action(id);
      setPendingId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const pendingCount = counts.PENDING ?? 0;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Bookings</h1>
          <div className="sub">
            {pendingCount === 0
              ? "No bookings waiting for approval"
              : `${pendingCount} booking${pendingCount === 1 ? "" : "s"} waiting for your approval`}
          </div>
        </div>
      </div>

      <div className="admin-content bk-page">
        <div className="bk-tabs">
          {TABS.map((t) => {
            const count = t.key === "ALL" ? undefined : counts[t.key] ?? 0;
            return (
              <Link
                key={t.key}
                href={`/admin/bookings?status=${t.key}`}
                className={`chip${filter === t.key ? " active" : ""}`}
              >
                {t.label}
                {count !== undefined && count > 0 ? ` (${count})` : ""}
              </Link>
            );
          })}
        </div>

        {error && <div className="bk-error">{error}</div>}

        {rows.length === 0 ? (
          <div className="card pad">
            <p className="mb-empty" style={{ margin: 0 }}>
              {filter === "PENDING"
                ? "Nothing to approve right now — new customer bookings will land here."
                : "No bookings in this tab."}
            </p>
          </div>
        ) : (
          <div className="card bk-table-wrap">
            <table className="bk-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Court</th>
                  <th>Customer</th>
                  <th>Players</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const busy = pendingId === b.id;
                  return (
                    <tr key={b.id} className={b.isPast ? "past" : undefined}>
                      <td>
                        <div className="strong">{b.dateLabel}</div>
                        <div className="soft">
                          {timeLabel(b.startTime)} – {timeLabel(b.endTime)}
                          {b.isPast ? " · past" : ""}
                        </div>
                      </td>
                      <td>
                        <div className="strong">{b.courtName}</div>
                        <div className="soft">{b.courtType === "INDOOR" ? "Indoor" : "Outdoor"}</div>
                      </td>
                      <td>
                        <div className="strong">{b.customerName}</div>
                        <div className="soft">
                          {b.customerEmail ?? b.customerPhone ?? "—"} · {b.confirmationCode}
                        </div>
                      </td>
                      <td>{b.players}</td>
                      <td className="strong">{peso(b.totalPrice)}</td>
                      <td>
                        <span className={`badge ${BOOKING_STATUS_BADGE[b.status]}`}>
                          {BOOKING_STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="right">
                        {b.status === "PENDING" && (
                          <div className="bk-actions">
                            <button
                              className="mini-btn approve"
                              disabled={busy}
                              onClick={() => run(b.id, approveBooking)}
                            >
                              {busy ? "…" : "Approve"}
                            </button>
                            <button
                              className="mini-btn danger"
                              disabled={busy}
                              onClick={() => run(b.id, declineBooking)}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {b.status === "CONFIRMED" && !b.isPast && (
                          <div className="bk-actions">
                            <button
                              className="mini-btn danger"
                              disabled={busy}
                              onClick={() => run(b.id, cancelBookingAsAdmin)}
                            >
                              {busy ? "…" : "Cancel"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
