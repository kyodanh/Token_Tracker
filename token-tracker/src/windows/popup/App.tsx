import { usePopupStore } from "../../store/popup";
import { usePolling } from "../../hooks/usePolling";
import { ProviderCard } from "../../components/ProviderCard";
import { WeeklyChart } from "../../components/WeeklyChart";
import { SubscriptionsList } from "../../components/SubscriptionsList";
import { api } from "../../lib/api";

function HeaderBarIcon() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18 }}>
      <div style={{ width: 3, height: 7, background: "#e8943a", borderRadius: 1 }} />
      <div style={{ width: 3, height: 11, background: "#e8943a", borderRadius: 1 }} />
      <div style={{ width: 3, height: 15, background: "#e8943a", borderRadius: 1 }} />
      <div style={{ width: 3, height: 18, background: "#e8943a", borderRadius: 1 }} />
    </div>
  );
}

function HeroBarIcon() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 3,
        height: 26,
        padding: 6,
        background: "rgba(232,148,58,0.12)",
        borderRadius: 9,
      }}
    >
      <div style={{ width: 3, height: 8, background: "#e8943a", borderRadius: 1 }} />
      <div style={{ width: 3, height: 14, background: "#e8943a", borderRadius: 1 }} />
      <div style={{ width: 3, height: 20, background: "#e8943a", borderRadius: 1 }} />
    </div>
  );
}

const BTN = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 8,
  background: "rgba(255,255,255,0.05)",
  border: "none",
  cursor: "pointer",
  color: "#9a9a9e",
  flexShrink: 0,
  transition: "background 0.15s",
};

export function App() {
  const { summary, weeklySpend, subscriptions, loading } = usePopupStore();
  const refresh = usePopupStore((s) => s.refresh);
  usePolling();

  const totalCost = summary?.totalCostUsd ?? 0;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "linear-gradient(180deg,#1e1e20 0%,#181819 100%)",
        color: "#e9e9ec",
        fontFamily: "-apple-system,'Inter',sans-serif",
        overflow: "hidden",
        userSelect: "none",
        borderRadius: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 12px" }}>
        {/* Drag region covers only the title area */}
        <div data-tauri-drag-region style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <HeaderBarIcon />
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px" }}>
            Tokens 4 Breakfast
          </span>
        </div>
        <button
          onClick={refresh}
          title="Refresh"
          style={BTN}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")}
        >
          {loading ? (
            <span style={{ fontSize: 15, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          )}
        </button>
        <button
          onClick={() => api.openSettings()}
          title="Settings"
          style={BTN}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: "6px 16px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <HeroBarIcon />
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>Token Appetite</div>
          <div style={{ fontSize: 12.5, color: "#8a8a8e", marginTop: 1 }}>Burn tokens, not your wallet.</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!summary && (
          <div style={{ padding: "0 16px 12px", fontSize: 13, color: "#6a6a6e" }}>Loading providers…</div>
        )}

        {(summary?.providers ?? []).map((ps) => (
          <ProviderCard key={ps.provider.id} summary={ps} />
        ))}

        <WeeklyChart weeklySpend={weeklySpend} totalCost={totalCost} />

        <SubscriptionsList subscriptions={subscriptions} onManage={() => api.openSettings()} />

        <div style={{ height: 14 }} />
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => api.openSettings()}
          style={{ fontSize: 12, fontWeight: 600, color: "#f0a850", background: "none", border: "none", cursor: "pointer" }}
        >
          View History
        </button>
        <span style={{ fontSize: 12, color: "#6a6a6e" }}>{today}</span>
        <button
          onClick={() => api.openSettings()}
          style={{ fontSize: 12, fontWeight: 600, color: "#9a9a9e", background: "none", border: "none", cursor: "pointer" }}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
