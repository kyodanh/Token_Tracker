import type { ProviderSummary } from "../lib/types";
import { PROVIDER_DISPLAY } from "../lib/types";
import { api } from "../lib/api";
import { usePopupStore } from "../store/popup";

interface Props {
  summary: ProviderSummary;
}

function ProgressBar({ percent, thin }: { percent: number; thin?: boolean }) {
  const color =
    percent >= 80 ? "bg-red-500" : percent >= 50 ? "bg-yellow-400" : "bg-green-500";
  return (
    <div className={`rounded-full bg-[#2a2a2a] overflow-hidden ${thin ? "h-1 mt-1" : "h-1.5 mt-1.5"}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function timeSince(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return formatTime(ts);
}

function formatResetsAt(isoString: string): string {
  const d = new Date(isoString);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days[d.getDay()];
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `resets ${day} at ${h12}:${m}${ampm}`;
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
  const pctColor =
    pct == null ? "text-green-400"
    : pct >= 80 ? "text-red-400"
    : pct >= 50 ? "text-yellow-400"
    : "text-green-400";

  const capturedLabel = snapshot?.capturedAt ? `today at ${formatTime(snapshot.capturedAt)}` : "";
  const syncedLabel = provider.lastSyncedAt ? timeSince(provider.lastSyncedAt) : null;

  return (
    <div className="px-4 py-3 border-b border-[#2a2a2a]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-sm font-semibold" style={{ color: display.color }}>
            {display.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="text-[#555] hover:text-[#e5e5e5] transition-colors text-base leading-none"
            title="Refresh"
          >
            ↺
          </button>
          <span className="text-[10px] text-green-400 font-medium tracking-wide">live</span>
        </div>
      </div>

      {snapshot ? (
        <>
          {/* Current session block */}
          <div className="bg-[#181818] rounded-lg px-3 py-2 mb-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#555] font-semibold tracking-widest">CURRENT SESSION</span>
              {capturedLabel && (
                <span className="text-[9px] text-[#555]">{capturedLabel}</span>
              )}
            </div>
            {pct != null ? (
              <div className="mt-0.5">
                <span className={`text-2xl font-bold leading-none ${pctColor}`}>
                  {pct}
                  <span className="text-base font-semibold">%</span>
                </span>
                <ProgressBar percent={pct} thin />
              </div>
            ) : snapshot.costUsd != null ? (
              <span className="text-lg font-bold text-[#e5e5e5] mt-0.5 block">
                ${snapshot.costUsd.toFixed(3)}
              </span>
            ) : (
              <span className="text-xs text-[#555] mt-1 block">
                Session active · no usage quota exposed
              </span>
            )}
          </div>

          {/* Weekly limit block */}
          {weeklyUsagePercent != null && (
            <div className="bg-[#181818] rounded-lg px-3 py-2 mb-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#555] font-semibold tracking-widest">WEEKLY LIMIT</span>
              </div>
              <div className="mt-0.5">
                {(() => {
                  const wp = Math.round(weeklyUsagePercent);
                  const wColor = wp >= 80 ? "text-red-400" : wp >= 50 ? "text-yellow-400" : "text-green-400";
                  return (
                    <>
                      <span className={`text-2xl font-bold leading-none ${wColor}`}>
                        {wp}<span className="text-base font-semibold">%</span>
                      </span>
                      <ProgressBar percent={wp} thin />
                    </>
                  );
                })()}
              </div>
              {weeklyResetsAt && (
                <p className="text-[9px] text-[#555] mt-1">{formatResetsAt(weeklyResetsAt)}</p>
              )}
            </div>
          )}

          {/* Footer row */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-[#555]">{syncedLabel}</span>
            <span className="text-[10px] text-green-400 font-medium">
              {display.name.toLowerCase().replace(/\s+/g, ".")}.live
            </span>
          </div>
        </>
      ) : (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-[#555]">
            {provider.id === "claude_code" ? "Reading ~/.claude/logs..." : "Not connected"}
          </span>
          {provider.id !== "claude_code" && (
            <button
              onClick={() => api.openSettings()}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Connect →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
