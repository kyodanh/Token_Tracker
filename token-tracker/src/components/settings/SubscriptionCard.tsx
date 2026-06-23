import { useState } from "react";
import type { Subscription } from "../../lib/types";
import { PROVIDER_DISPLAY } from "../../lib/types";
import { api } from "../../lib/api";

function nextBillingTimestamp(dayOfMonth: number): number {
  const now = new Date();
  const day = Math.max(1, Math.min(31, dayOfMonth));
  let candidate = new Date(now.getFullYear(), now.getMonth(), day);
  if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return Math.floor(candidate.getTime() / 1000);
}

function countdownInfo(nextResetAt: number | null) {
  if (!nextResetAt) return null;
  const diffSec = nextResetAt - Date.now() / 1000;
  if (diffSec <= 0) return { days: 0, hours: 0, urgent: true };
  const days = Math.floor(diffSec / 86400);
  return { days, hours: Math.floor((diffSec % 86400) / 3600), urgent: days <= 3 };
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#e9e9ec", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 600, color: "#6a6a6e", letterSpacing: "0.3px", marginBottom: 5, display: "block",
};

function DetailRow({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#5a5a5e", marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: urgent ? "#f0a850" : "#c0c0c4" }}>{value}</div>
    </div>
  );
}

interface Props {
  sub: Subscription;
  onUpdated: () => void;
  onRemoved: () => void;
}

export function SubscriptionCard({ sub, onUpdated, onRemoved }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    planName: sub.planName ?? "",
    costUsd: sub.costUsd?.toString() ?? "",
    billingCycle: sub.billingCycle ?? "monthly",
    billingDay: sub.nextResetAt ? String(new Date(sub.nextResetAt * 1000).getDate()) : "",
  });

  const d = PROVIDER_DISPLAY[sub.providerId];
  const isUrgent = sub.nextResetAt !== null && sub.nextResetAt - Date.now() / 1000 < 3 * 86400;
  const billingDay = sub.nextResetAt ? new Date(sub.nextResetAt * 1000).getDate() : null;
  const nextDate = sub.nextResetAt
    ? new Date(sub.nextResetAt * 1000).toLocaleDateString("vi-VN", { day: "numeric", month: "long" })
    : null;
  const cd = countdownInfo(sub.nextResetAt);
  const annualEst = sub.costUsd && sub.billingCycle === "monthly" ? sub.costUsd * 12 : null;

  const handleSave = async () => {
    const day = parseInt(form.billingDay);
    await api.upsertSubscription({
      id: sub.id,
      providerId: sub.providerId,
      planName: form.planName || null,
      costUsd: parseFloat(form.costUsd) || null,
      billingCycle: (form.billingCycle as "monthly" | "annual") || null,
      nextResetAt: !isNaN(day) && day >= 1 && day <= 31 ? nextBillingTimestamp(day) : null,
    });
    onUpdated();
    setEditing(false);
  };

  return (
    <div style={{
      borderRadius: 12, background: "rgba(255,255,255,0.035)",
      border: `1px solid ${expanded ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
      borderLeft: "3px solid #e8943a", overflow: "hidden",
    }}>
      {/* Header row */}
      <div
        onClick={() => { if (!editing) setExpanded(e => !e); }}
        style={{ padding: "15px 16px", cursor: editing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(232,148,58,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
            {d?.icon ?? "💳"}
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "#e9e9ec" }}>{sub.planName ?? d?.name ?? sub.providerId}</div>
            {billingDay && (
              <div style={{ fontSize: 12, color: "#6a6a6e", marginTop: 2 }}>
                Ngày {billingDay} hàng tháng
                {nextDate && <span style={{ color: isUrgent ? "#f0a850" : "#5a5a5e" }}> · Lần tới: {nextDate}</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#b0b0b4", fontFamily: "'JetBrains Mono',monospace" }}>
            ${sub.costUsd?.toFixed(2) ?? "—"}/{sub.billingCycle === "annual" ? "yr" : "mo"}
          </span>
          <span style={{ fontSize: 11, color: expanded ? "#f0a850" : "#4a4a4e" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {!editing ? (
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: 14 }}>
                <DetailRow label="Provider" value={d?.name ?? sub.providerId} />
                <DetailRow label="Billing" value={sub.billingCycle === "annual" ? "Annual" : "Monthly"} />
                {nextDate && <DetailRow label="Next date" value={nextDate} urgent={isUrgent} />}
                {cd && <DetailRow label="Countdown" value={cd.days === 0 ? "Hôm nay" : cd.days === 1 ? "1 ngày" : `${cd.days}d ${cd.hours}h`} urgent={cd.urgent} />}
                {annualEst && <DetailRow label="Annual est." value={`~$${annualEst.toFixed(0)}/yr`} />}
                {sub.billingCycle === "annual" && sub.costUsd && <DetailRow label="Monthly est." value={`~$${(sub.costUsd / 12).toFixed(2)}/mo`} />}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditing(true)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, color: "#e9e9ec", cursor: "pointer" }}>Edit</button>
                <button onClick={() => { api.deleteSubscription(sub.id).then(onRemoved); }} style={{ flex: 1, background: "rgba(255,100,90,0.08)", border: "1px solid rgba(255,100,90,0.15)", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, color: "#ff7a6e", cursor: "pointer" }}>Remove</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Plan name</label>
                <input placeholder={d?.name ?? "e.g. Pro, Team..."} value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Cost (USD)</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#6a6a6e", pointerEvents: "none" }}>$</span>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={form.costUsd} onChange={(e) => setForm({ ...form, costUsd: e.target.value })} style={{ ...inputStyle, paddingLeft: 24 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Billing cycle</label>
                  <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value as "monthly" | "annual" })} style={inputStyle}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Ngày thanh toán <span style={{ color: "#444", fontWeight: 400 }}>(1–31)</span></label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="number" min="1" max="31" placeholder="vd: 5" value={form.billingDay} onChange={(e) => setForm({ ...form, billingDay: e.target.value })} style={{ ...inputStyle, width: 90, flexShrink: 0 }} />
                  {form.billingDay && !isNaN(parseInt(form.billingDay)) && (
                    <span style={{ fontSize: 12, color: "#8a8a8e" }}>
                      → {new Date(nextBillingTimestamp(parseInt(form.billingDay)) * 1000).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
                <button onClick={handleSave} style={{ flex: 1, background: "linear-gradient(180deg,#f0a850,#e8943a)", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#000", cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditing(false)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#8a8a8e", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
