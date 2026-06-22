import type { Subscription } from "../lib/types";
import { PROVIDER_DISPLAY } from "../lib/types";

interface Props {
  subscriptions: Subscription[];
  onManage: () => void;
}

export function SubscriptionsList({ subscriptions, onManage }: Props) {
  const total = subscriptions.reduce((sum, s) => sum + (s.costUsd ?? 0), 0);

  return (
    <div className="px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-[#666] font-semibold tracking-wide">SUBSCRIPTIONS</span>
        <button onClick={onManage} className="text-[10px] text-amber-400 hover:text-amber-300">
          Manage →
        </button>
      </div>
      {subscriptions.length === 0 ? (
        <p className="text-[#666] text-xs">No subscriptions added</p>
      ) : (
        subscriptions.map((sub) => {
          const display = PROVIDER_DISPLAY[sub.providerId];
          return (
            <div key={sub.id} className="flex justify-between items-center py-1">
              <span className="text-xs text-[#e5e5e5]">
                {display?.icon ?? "●"} {sub.planName ?? display?.name ?? sub.providerId}
              </span>
              <span className="text-xs text-[#666]">
                US${sub.costUsd?.toFixed(2) ?? "—"}/
                {sub.billingCycle === "annual" ? "yr" : "mo"}
              </span>
            </div>
          );
        })
      )}
      {subscriptions.length > 0 && (
        <>
          <div className="h-px bg-[#2a2a2a] my-2" />
          <div className="flex justify-between">
            <span className="text-xs text-[#666]">Subscriptions total</span>
            <span className="text-xs text-[#e5e5e5]">US${total.toFixed(2)}/mo</span>
          </div>
        </>
      )}
    </div>
  );
}
