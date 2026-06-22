import type { Subscription } from "../lib/types";
import { PROVIDER_DISPLAY } from "../lib/types";

interface Props {
  subscriptions: Subscription[];
  onManage: () => void;
}

export function SubscriptionsList({ subscriptions, onManage }: Props) {
  const total = subscriptions.reduce((sum, s) => sum + (s.costUsd ?? 0), 0);

  return (
    <div
      style={{
        margin: "14px 16px 0",
        padding: "13px 16px",
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.7px", color: "#7a7a7e" }}>
          SUBSCRIPTIONS
        </span>
        <button
          onClick={onManage}
          style={{ fontSize: 11.5, fontWeight: 600, color: "#f0a850", background: "none", border: "none", cursor: "pointer" }}
        >
          Manage →
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <p style={{ fontSize: 12, color: "#6a6a6e", marginTop: 11 }}>No subscriptions added</p>
      ) : (
        <>
          {subscriptions.map((sub) => {
            const display = PROVIDER_DISPLAY[sub.providerId];
            return (
              <div
                key={sub.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 11,
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span
                    style={{ width: 8, height: 8, borderRadius: 2, background: "#e8943a", flexShrink: 0 }}
                  />
                  {sub.planName ?? display?.name ?? sub.providerId}
                </span>
                <span style={{ fontSize: 12.5, color: "#b0b0b4", fontFamily: "'JetBrains Mono',monospace" }}>
                  US${sub.costUsd?.toFixed(2) ?? "—"}/{sub.billingCycle === "annual" ? "yr" : "mo"}
                </span>
              </div>
            );
          })}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "11px 0" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12.5, color: "#8a8a8e" }}>Subscriptions total</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0a850", fontFamily: "'JetBrains Mono',monospace" }}>
              US${total.toFixed(2)}/mo
            </span>
          </div>
        </>
      )}
    </div>
  );
}
