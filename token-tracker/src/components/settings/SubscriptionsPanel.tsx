import { useState, useEffect } from "react";
import type { Subscription } from "../../lib/types";
import { PROVIDER_DISPLAY } from "../../lib/types";
import { api } from "../../lib/api";
import { SubscriptionCard } from "./SubscriptionCard";

function nextBillingTimestamp(dayOfMonth: number): number {
  const now = new Date();
  const day = Math.max(1, Math.min(31, dayOfMonth));
  let candidate = new Date(now.getFullYear(), now.getMonth(), day);
  if (candidate <= now) candidate = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return Math.floor(candidate.getTime() / 1000);
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#e9e9ec", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 600, color: "#6a6a6e", letterSpacing: "0.3px", marginBottom: 5, display: "block",
};

export function SubscriptionsPanel() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ providerId: "claude_web", planName: "", costUsd: "", billingCycle: "monthly", billingDay: "" });

  useEffect(() => { api.getSubscriptions().then(setSubs); }, []);

  const refresh = async () => setSubs(await api.getSubscriptions());

  const save = async () => {
    const day = parseInt(form.billingDay);
    await api.upsertSubscription({
      providerId: form.providerId,
      planName: form.planName || null,
      costUsd: parseFloat(form.costUsd) || null,
      billingCycle: (form.billingCycle as "monthly" | "annual") || null,
      nextResetAt: !isNaN(day) && day >= 1 && day <= 31 ? nextBillingTimestamp(day) : null,
    });
    await refresh();
    setAdding(false);
    setForm({ providerId: "claude_web", planName: "", costUsd: "", billingCycle: "monthly", billingDay: "" });
  };

  return (
    <div style={{ padding: "22px 22px 28px", overflowY: "auto", height: "100%", background: "#1a1a1c" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.4px", color: "#e9e9ec" }}>Subscriptions</div>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{ fontSize: 13, fontWeight: 600, color: "#f0a850", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            + Add
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {subs.map((sub) => (
          <SubscriptionCard key={sub.id} sub={sub} onUpdated={refresh} onRemoved={refresh} />
        ))}

        {adding && (
          <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e9e9ec" }}>New Subscription</span>
              <button onClick={() => setAdding(false)} style={{ fontSize: 20, lineHeight: 1, color: "#555", background: "none", border: "none", cursor: "pointer", padding: 0 }}>×</button>
            </div>
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Provider</label>
                <select value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })} style={inputStyle}>
                  {Object.entries(PROVIDER_DISPLAY).map(([id, d]) => (
                    <option key={id} value={id}>{d.icon} {d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Plan name <span style={{ color: "#444", fontWeight: 400 }}>(optional)</span></label>
                <input placeholder={PROVIDER_DISPLAY[form.providerId]?.name ?? "e.g. Pro, Team..."} value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} style={inputStyle} />
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
                  <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })} style={inputStyle}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Ngày thanh toán hàng tháng <span style={{ color: "#444", fontWeight: 400 }}>(optional, 1–31)</span></label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="number" min="1" max="31" placeholder="vd: 5" value={form.billingDay} onChange={(e) => setForm({ ...form, billingDay: e.target.value })} style={{ ...inputStyle, width: 90, flexShrink: 0 }} />
                  {form.billingDay && !isNaN(parseInt(form.billingDay)) && (
                    <span style={{ fontSize: 12, color: "#8a8a8e" }}>
                      → Lần tới: {new Date(nextBillingTimestamp(parseInt(form.billingDay)) * 1000).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
                <button onClick={save} style={{ flex: 1, background: "linear-gradient(180deg,#f0a850,#e8943a)", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#000", cursor: "pointer" }}>Save</button>
                <button onClick={() => setAdding(false)} style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "#8a8a8e", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
