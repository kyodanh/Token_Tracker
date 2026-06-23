import type { Subscription } from "../lib/types";
import { PROVIDER_DISPLAY } from "../lib/types";

interface Props {
  subscriptions: Subscription[];
  onManage: () => void;
}

function countdown(nextResetAt: number | null): { days: number | null; hours: number | null; urgent: boolean } {
  if (!nextResetAt) return { days: null, hours: null, urgent: false };
  const diffSec = nextResetAt - Date.now() / 1000;
  if (diffSec <= 0) return { days: 0, hours: 0, urgent: true };
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  return { days, hours, urgent: days <= 3 };
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
            const { days, hours, urgent } = countdown(sub.nextResetAt);
            const billingDay = sub.nextResetAt ? new Date(sub.nextResetAt * 1000).getDate() : null;

            // countdown label
            let countdownLabel: string | null = null;
            if (days === 0) countdownLabel = "Hôm nay";
            else if (days === 1) countdownLabel = "1 ngày";
            else if (days !== null && days <= 6) countdownLabel = `${days}d ${hours}h`;
            else if (days !== null) countdownLabel = `${days}d`;

            return (
              <div key={sub.id} style={{ marginTop: 11 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#e8943a", flexShrink: 0 }} />
                    {sub.planName ?? display?.name ?? sub.providerId}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {countdownLabel && (
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: urgent ? "#f0a850" : "#6a6a6e",
                          background: urgent ? "rgba(240,168,80,0.14)" : "rgba(255,255,255,0.05)",
                          padding: "2px 7px",
                          borderRadius: 5,
                          fontFamily: "'JetBrains Mono',monospace",
                          border: urgent ? "1px solid rgba(240,168,80,0.25)" : "1px solid transparent",
                        }}
                      >
                        {countdownLabel}
                      </span>
                    )}
                    <span style={{ fontSize: 12.5, color: "#b0b0b4", fontFamily: "'JetBrains Mono',monospace" }}>
                      ${sub.costUsd?.toFixed(2) ?? "—"}/{sub.billingCycle === "annual" ? "yr" : "mo"}
                    </span>
                  </div>
                </div>
                {billingDay && (
                  <div style={{ fontSize: 11, color: urgent ? "#a07030" : "#4a4a4e", marginTop: 3 }}>
                    Thanh toán ngày {billingDay} hàng tháng
                    {urgent && days !== null && days <= 1 && (
                      <span style={{ color: "#f0a850", marginLeft: 6, fontWeight: 600 }}>⚠ sắp đến hạn</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "11px 0" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12.5, color: "#8a8a8e" }}>Tổng/tháng</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f0a850", fontFamily: "'JetBrains Mono',monospace" }}>
              ${total.toFixed(2)}/mo
            </span>
          </div>
        </>
      )}
    </div>
  );
}
