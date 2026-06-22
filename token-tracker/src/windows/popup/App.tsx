import { usePopupStore } from "../../store/popup";
import { usePolling } from "../../hooks/usePolling";
import { ProviderCard } from "../../components/ProviderCard";
import { WeeklyChart } from "../../components/WeeklyChart";
import { SubscriptionsList } from "../../components/SubscriptionsList";
import { api } from "../../lib/api";

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="9" width="4" height="8" rx="1" fill="#f59e0b" />
      <rect x="7" y="5" width="4" height="12" rx="1" fill="#f59e0b" />
      <rect x="13" y="1" width="4" height="16" rx="1" fill="#f59e0b" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="#666" strokeWidth="1.2" />
      <path d="M8 4.5V8.5L10.5 10" stroke="#666" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="#666" strokeWidth="1.2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" stroke="#666" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1a1a1a" />
      <rect x="4" y="16" width="4" height="8" rx="1" fill="#f59e0b" />
      <rect x="12" y="10" width="4" height="14" rx="1" fill="#f59e0b" />
      <rect x="20" y="4" width="4" height="20" rx="1" fill="#f59e0b" />
    </svg>
  );
}

export function App() {
  const { summary, weeklySpend, subscriptions, loading, isPro } = usePopupStore();
  const refresh = usePopupStore((s) => s.refresh);
  usePolling();

  const totalCost = summary?.totalCostUsd ?? 0;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-[#e5e5e5] overflow-hidden select-none">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a] cursor-default flex-shrink-0"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-2">
          <BarChartIcon />
          <span className="font-bold text-sm text-[#e5e5e5] tracking-wide">Tokens 4 Breakfast</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="text-[#666] hover:text-[#e5e5e5] transition-colors leading-none"
            title="Refresh all"
          >
            {loading ? (
              <span className="text-base animate-spin inline-block">⟳</span>
            ) : (
              <HistoryIcon />
            )}
          </button>
          <button
            onClick={() => api.openSettings()}
            className="text-[#666] hover:text-[#e5e5e5] transition-colors leading-none"
            title="Settings"
          >
            <GearIcon />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] flex-shrink-0">
        <InsightsIcon />
        <div>
          <h1 className="text-sm font-bold text-[#e5e5e5] leading-tight">Token Appetite</h1>
          <p className="text-[11px] text-[#555] mt-0.5">Burn tokens, not your wallet.</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Provider cards */}
        {(summary?.providers ?? []).map((ps) => (
          <ProviderCard key={ps.provider.id} summary={ps} />
        ))}

        {!summary && (
          <div className="px-4 py-4 text-sm text-[#555]">Loading providers...</div>
        )}

        {/* Unlock insights promo — only for free users */}
        {!isPro && (
          <button
            onClick={() => api.openSettings()}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a] hover:bg-[#181818] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="9" width="3" height="5" rx="0.5" fill="#f59e0b" />
                  <rect x="6.5" y="6" width="3" height="8" rx="0.5" fill="#f59e0b" />
                  <rect x="11" y="3" width="3" height="11" rx="0.5" fill="#f59e0b" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[#e5e5e5]">Unlock Usage Insights</p>
                <p className="text-[10px] text-[#555]">See where your tokens go →</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#555] group-hover:text-[#888] transition-colors flex-shrink-0">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* 7-day chart */}
        <WeeklyChart weeklySpend={weeklySpend} totalCost={totalCost} />

        {/* Subscriptions */}
        <SubscriptionsList
          subscriptions={subscriptions}
          onManage={() => api.openSettings()}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#2a2a2a] text-[11px] text-[#555] flex-shrink-0">
        <button
          onClick={() => api.openSettings()}
          className="text-amber-500 hover:text-amber-400 transition-colors font-medium"
        >
          View History
        </button>
        <span className="text-[#444]">{today}</span>
        <button
          onClick={() => api.openSettings()}
          className="hover:text-[#e5e5e5] transition-colors"
        >
          Settings
        </button>
      </div>
    </div>
  );
}
