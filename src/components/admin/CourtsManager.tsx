"use client";

import { useState, useTransition } from "react";
import { saveCourts, type CourtInput } from "@/app/admin/(protected)/actions";

let tempCounter = 0;

export default function CourtsManager({
  courts,
  defaultOpen,
  defaultClose,
}: {
  courts: CourtInput[];
  defaultOpen: string;
  defaultClose: string;
}) {
  const [items, setItems] = useState<CourtInput[]>(courts);
  const [saved, setSaved] = useState(courts);
  const [pending, startTransition] = useTransition();

  const isDirty = JSON.stringify(items) !== JSON.stringify(saved);

  function update(id: string, patch: Partial<CourtInput>) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCourt() {
    tempCounter += 1;
    const nextNum = items.length + 1;
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${tempCounter}`,
        name: `Court ${nextNum}`,
        type: "INDOOR",
        lighted: false,
        pricePerHour: 300,
        is24Hours: false,
        opensAt: defaultOpen,
        closesAt: defaultClose,
        status: "ACTIVE",
      },
    ]);
  }

  function removeCourt(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  }

  function stepCourts(delta: number) {
    if (delta > 0) addCourt();
    else if (items.length > 1) setItems((prev) => prev.slice(0, -1));
  }

  function handleSave() {
    startTransition(async () => {
      await saveCourts(items);
      setSaved(items);
    });
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Courts &amp; Hours</h1>
          <div className="sub">Manage courts, pricing and operating hours</div>
        </div>
        <div className="topbar-actions">
          <span className="save-indicator">
            <span className="dot" />
            <span>{isDirty ? "Unsaved changes" : "All changes saved"}</span>
          </span>
          <button className="pill-btn" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="card pad">
          <div className="courts-toolbar">
            <div>
              <h3>Number of Courts</h3>
              <p className="desc">Add or remove courts. Each court gets its own hours, pricing and amenities.</p>
            </div>
            <div className="stepper">
              <button onClick={() => stepCourts(-1)}>−</button>
              <span className="count">{items.length}</span>
              <span className="lbl">courts</span>
              <button onClick={() => stepCourts(1)}>+</button>
            </div>
          </div>
        </div>

        <div className="courts-list">
          {items.map((c, idx) => (
            <div className="court-admin-card card" key={c.id}>
              <div className="court-admin-head">
                <div className="court-index">{idx + 1}</div>
                <input
                  className="ct-name"
                  value={c.name}
                  onChange={(e) => update(c.id, { name: e.target.value })}
                />
                <button
                  className="court-remove-btn"
                  title="Remove court"
                  onClick={() => removeCourt(c.id)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                  </svg>
                </button>
              </div>
              <div className="court-admin-grid">
                <div className="field">
                  <label>Type</label>
                  <div className="segmented">
                    <button
                      type="button"
                      className={`seg-btn${c.type === "INDOOR" ? " active" : ""}`}
                      onClick={() => update(c.id, { type: "INDOOR" })}
                    >
                      Indoor
                    </button>
                    <button
                      type="button"
                      className={`seg-btn${c.type === "OUTDOOR" ? " active" : ""}`}
                      onClick={() => update(c.id, { type: "OUTDOOR" })}
                    >
                      Outdoor
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select
                    value={c.status}
                    onChange={(e) => update(c.id, { status: e.target.value as CourtInput["status"] })}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>
                <div className="field">
                  <label>Price / hour</label>
                  <div className="input-prefix">
                    <span>₱</span>
                    <input
                      type="number"
                      min={0}
                      value={c.pricePerHour}
                      onChange={(e) => update(c.id, { pricePerHour: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>
                <div className="field toggle-field">
                  <label>Lighted</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={c.lighted}
                      onChange={(e) => update(c.id, { lighted: e.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="field toggle-field">
                  <label>Open 24 Hours</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={c.is24Hours}
                      onChange={(e) =>
                        update(c.id, {
                          is24Hours: e.target.checked,
                          ...(e.target.checked ? { opensAt: "00:00", closesAt: "23:59" } : {}),
                        })
                      }
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="field">
                  <label>Opens</label>
                  <input
                    type="time"
                    value={c.opensAt}
                    disabled={c.is24Hours}
                    onChange={(e) => update(c.id, { opensAt: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Closes</label>
                  <input
                    type="time"
                    value={c.closesAt}
                    disabled={c.is24Hours}
                    onChange={(e) => update(c.id, { closesAt: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="pill-btn secondary" style={{ marginTop: 14 }} onClick={addCourt}>
          + Add Another Court
        </button>
      </div>
    </>
  );
}
