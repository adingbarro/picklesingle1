"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFacility, addFacility, removeFacility } from "@/app/admin/(protected)/actions";

type Facility = { id: string; label: string; icon: string; enabled: boolean };

export default function FacilitiesManager({ facilities }: { facilities: Facility[] }) {
  const [items, setItems] = useState(facilities);
  const [newLabel, setNewLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(id: string, enabled: boolean) {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, enabled } : f)));
    startTransition(async () => {
      await toggleFacility(id, enabled);
    });
  }

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    setNewLabel("");
    startTransition(async () => {
      await addFacility(label);
      router.refresh();
    });
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((f) => f.id !== id));
    startTransition(async () => {
      await removeFacility(id);
    });
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Facilities &amp; Amenities</h1>
          <div className="sub">What your club offers on-site</div>
        </div>
        <div className="topbar-actions">
          <span className="save-indicator">
            <span className="dot" />
            <span>{pending ? "Saving…" : "All changes saved"}</span>
          </span>
        </div>
      </div>

      <div className="admin-content">
        <div className="card pad">
          <h3>Facilities &amp; Amenities</h3>
          <p className="desc">Toggle what&apos;s available at your club. Enabled facilities show as badges on your customer app.</p>
          <div className="facility-grid">
            {items.map((f) => (
              <div key={f.id} className={`facility-item${f.enabled ? " on" : ""}`}>
                <span className="fi-icon">{f.icon}</span>
                <span className="fi-label">{f.label}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={f.enabled}
                    onChange={(e) => handleToggle(f.id, e.target.checked)}
                  />
                  <span className="slider" />
                </label>
                <button
                  className="text-btn"
                  style={{ padding: "0 0 0 4px" }}
                  onClick={() => handleRemove(f.id)}
                  title="Remove facility"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="add-facility-row">
            <input
              type="text"
              placeholder="Add a custom facility (e.g. Ball Machine Rental)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button className="pill-btn secondary" onClick={handleAdd}>
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
