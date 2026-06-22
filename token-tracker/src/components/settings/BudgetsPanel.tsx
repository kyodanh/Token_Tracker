import { useSettingsStore } from "../../store/settings";

export function BudgetsPanel() {
  const isPro = useSettingsStore((s) => s.licenseInfo?.tier === "pro");

  if (!isPro) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
        <span className="text-4xl">🔒</span>
        <p className="text-sm text-[#666] text-center">Budgets & spending limits require TokenTracker Pro</p>
        <button
          onClick={() => {}}
          className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-6 py-2 rounded"
        >
          Upgrade to Pro — $7.99
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-4">Budgets</h2>
      <p className="text-xs text-[#666]">Set monthly spending limits per provider. Coming soon.</p>
    </div>
  );
}
