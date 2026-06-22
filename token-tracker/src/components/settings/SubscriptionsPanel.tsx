import { useState, useEffect } from "react";
import type { Subscription } from "../../lib/types";
import { PROVIDER_DISPLAY } from "../../lib/types";
import { api } from "../../lib/api";

export function SubscriptionsPanel() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    providerId: "claude_web",
    planName: "",
    costUsd: "",
    billingCycle: "monthly",
  });

  useEffect(() => { api.getSubscriptions().then(setSubs); }, []);

  const save = async () => {
    await api.upsertSubscription({
      providerId: form.providerId,
      planName: form.planName || null,
      costUsd: parseFloat(form.costUsd) || null,
      billingCycle: (form.billingCycle as "monthly" | "annual") || null,
      nextResetAt: null,
    });
    setSubs(await api.getSubscriptions());
    setAdding(false);
    setForm({ providerId: "claude_web", planName: "", costUsd: "", billingCycle: "monthly" });
  };

  const remove = async (id: number) => {
    await api.deleteSubscription(id);
    setSubs(await api.getSubscriptions());
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-[#e5e5e5]">Subscriptions</h2>
        <button onClick={() => setAdding(true)} className="text-xs text-amber-400 hover:text-amber-300">
          + Add
        </button>
      </div>

      {subs.map((sub) => {
        const d = PROVIDER_DISPLAY[sub.providerId];
        return (
          <div key={sub.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
            <span className="text-sm text-[#e5e5e5]">{d?.icon} {sub.planName ?? d?.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#666]">
                ${sub.costUsd?.toFixed(2)}/{sub.billingCycle === "annual" ? "yr" : "mo"}
              </span>
              <button onClick={() => remove(sub.id)} className="text-xs text-red-400 hover:text-red-300">
                Remove
              </button>
            </div>
          </div>
        );
      })}

      {adding && (
        <div className="mt-4 bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] space-y-3">
          <select
            value={form.providerId}
            onChange={(e) => setForm({ ...form, providerId: e.target.value })}
            className="w-full bg-[#0f0f0f] border border-[#3a3a3a] rounded px-3 py-1.5 text-sm text-[#e5e5e5] focus:outline-none"
          >
            {Object.entries(PROVIDER_DISPLAY).map(([id, d]) => (
              <option key={id} value={id}>{d.name}</option>
            ))}
          </select>
          <input
            placeholder="Plan name"
            value={form.planName}
            onChange={(e) => setForm({ ...form, planName: e.target.value })}
            className="w-full bg-[#0f0f0f] border border-[#3a3a3a] rounded px-3 py-1.5 text-sm text-[#e5e5e5] placeholder-[#555] focus:outline-none"
          />
          <input
            type="number"
            placeholder="Monthly cost (USD)"
            value={form.costUsd}
            onChange={(e) => setForm({ ...form, costUsd: e.target.value })}
            className="w-full bg-[#0f0f0f] border border-[#3a3a3a] rounded px-3 py-1.5 text-sm text-[#e5e5e5] placeholder-[#555] focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={save} className="bg-amber-500 hover:bg-amber-400 text-black text-xs px-4 py-1.5 rounded">
              Save
            </button>
            <button onClick={() => setAdding(false)} className="text-[#666] hover:text-[#e5e5e5] text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
