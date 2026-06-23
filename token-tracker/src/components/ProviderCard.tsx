import type { ProviderSummary } from "../lib/types";
import { PROVIDER_DISPLAY } from "../lib/types";
import { api } from "../lib/api";
import { usePopupStore } from "../store/popup";

interface Props {
  summary: ProviderSummary;
}

// captured_at / last_synced_at come from SQLite unixepoch() → seconds, multiply by 1000 for JS Date
function formatTime(tsSeconds: number) {
  return new Date(tsSeconds * 1000)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function timeSince(tsSeconds: number) {
  const diff = Date.now() - tsSeconds * 1000;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return formatTime(tsSeconds);
}

// Format an ISO reset time: if today → "resets at X:XXpm", otherwise "resets Day at X:XXpm"
function formatResetsAt(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return isToday
    ? `resets today at ${h12}:${m}${ampm}`
    : `resets ${days[d.getDay()]} at ${h12}:${m}${ampm}`;
}

function usageColor(pct: number) {
  if (pct >= 80) return "#ff6b6b";
  if (pct >= 50) return "#f0a850";
  return "#3ecf8e";
}

export function ProviderCard({ summary }: Props) {
  const refresh = usePopupStore((s) => s.refresh);
  const { provider, snapshot, usagePercent, weeklyUsagePercent, weeklyResetsAt } = summary;
  const display = PROVIDER_DISPLAY[provider.id] ?? { name: provider.name, icon: "●", color: "#888" };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.syncProvider(provider.id);
      await refresh();
    } catch {}
  };

  const pct = usagePercent != null ? Math.round(usagePercent) : null;
  const wpct = weeklyUsagePercent != null ? Math.round(weeklyUsagePercent) : null;

  // Extract five_hour.resets_at from raw_json for session reset time
  const rawParsed = snapshot?.rawJson
    ? (() => { try { return JSON.parse(snapshot.rawJson); } catch { return null; } })()
    : null;
  const sessionResetsAt: string | null = rawParsed?.five_hour?.resets_at ?? null;

  // CURRENT SESSION header label: prefer reset time, fall back to update time
  const sessionLabel = sessionResetsAt
    ? formatResetsAt(sessionResetsAt)
    : snapshot?.capturedAt
    ? `updated ${formatTime(snapshot.capturedAt)}`
    : "";

  const syncedLabel = provider.lastSyncedAt ? timeSince(provider.lastSyncedAt) : "just now";

  return (
    <div style={{ padding: "0 16px 14px" }}>
      {/* Provider row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 12 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#3ecf8e",
            boxShadow: "0 0 8px rgba(62,207,142,0.7)",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#e8943a", lineHeight: 1.2 }}>{display.name}</span>
          {provider.accountLabel && (
            <span
              style={{
                fontSize: 10.5,
                color: "#b0b0b8",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 180,
              }}
            >
              {provider.accountLabel}
            </span>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleRefresh}
          title="Refresh"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#7a7a7e", padding: 2, display: "flex", alignItems: "center" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "#3ecf8e",
            background: "rgba(62,207,142,0.1)",
            padding: "3px 8px",
            borderRadius: 20,
          }}
        >
          live
        </span>
      </div>

      {/* Limit card */}
      <div
        style={{
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {snapshot ? (
          <>
            {/* Current session */}
            <div style={{ padding: "14px 16px 16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.7px", color: "#7a7a7e" }}>
                  CURRENT SESSION
                </span>
                {sessionLabel && (
                  <span style={{ fontSize: 11, color: "#6a6a6e" }}>{sessionLabel}</span>
                )}
              </div>

              {pct != null ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: -0.5,
                          color: usageColor(pct),
                          fontFamily: "'JetBrains Mono',monospace",
                          lineHeight: 1,
                        }}
                      >
                        {pct}<span style={{ fontSize: 14 }}>%</span>
                      </span>
                      <span style={{ fontSize: 11.5, color: "#7a7a7e" }}>of session limit</span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: usageColor(pct),
                        background: `${usageColor(pct)}18`,
                        padding: "2px 8px",
                        borderRadius: 5,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {100 - pct}% remaining
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 9,
                      height: 6,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        height: "100%",
                        borderRadius: 6,
                        background: `linear-gradient(90deg,${usageColor(pct)}99,${usageColor(pct)})`,
                        boxShadow: `0 0 8px ${usageColor(pct)}80`,
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                </>
              ) : snapshot.costUsd != null ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: -0.5,
                      color: "#3ecf8e",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    ${snapshot.costUsd.toFixed(3)}
                  </span>
                  <span style={{ fontSize: 11.5, color: "#7a7a7e" }}>this session</span>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: "#6a6a6e", display: "block", marginTop: 8 }}>
                  Session active · no usage quota exposed
                </span>
              )}
            </div>

            {/* Weekly limit */}
            {wpct != null && (
              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.7px", color: "#7a7a7e" }}>
                      WEEKLY LIMIT
                    </span>
                    {weeklyResetsAt && (
                      <span style={{ fontSize: 11, color: "#6a6a6e" }}>{formatResetsAt(weeklyResetsAt)}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: -0.5,
                          color: usageColor(wpct),
                          fontFamily: "'JetBrains Mono',monospace",
                          lineHeight: 1,
                        }}
                      >
                        {wpct}<span style={{ fontSize: 14 }}>%</span>
                      </span>
                      <span style={{ fontSize: 11.5, color: "#7a7a7e" }}>of weekly allowance</span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: usageColor(wpct),
                        background: `${usageColor(wpct)}18`,
                        padding: "2px 8px",
                        borderRadius: 5,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {100 - wpct}% remaining
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 11,
                      height: 7,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(wpct, 100)}%`,
                        height: "100%",
                        borderRadius: 6,
                        background: `linear-gradient(90deg,${usageColor(wpct)}99,${usageColor(wpct)})`,
                        boxShadow: `0 0 10px ${usageColor(wpct)}80`,
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Card footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 16px",
                background: "rgba(255,255,255,0.02)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontSize: 10.5, color: "#6a6a6e" }}>updated {syncedLabel}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "#3ecf8e" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3ecf8e" }} />
                {display.name.toLowerCase().replace(/\s+/g, ".")}.live
              </span>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "#6a6a6e" }}>
              {provider.id === "claude_code" ? "Reading ~/.claude/logs…" : "Not connected"}
            </span>
            {provider.id !== "claude_code" && (
              <button
                onClick={() => api.openSettings()}
                style={{
                  fontSize: 12,
                  color: "#f0a850",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Connect →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
