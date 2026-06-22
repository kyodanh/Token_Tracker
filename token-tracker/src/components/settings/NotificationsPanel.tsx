import { useSettingsStore } from "../../store/settings";

function ToggleRow({
  label,
  description,
  value,
  onChange,
  locked,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-[#2a2a2a]">
      <div className="flex-1 pr-4">
        <p className="text-sm text-[#e5e5e5]">{label} {locked && "🔒"}</p>
        {description && <p className="text-xs text-[#666] mt-0.5">{description}</p>}
      </div>
      <label className={`relative inline-flex items-center ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => !locked && onChange(e.target.checked)}
          disabled={locked}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-[#333] peer-checked:bg-amber-500 rounded-full transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
      </label>
    </div>
  );
}

export function NotificationsPanel() {
  const { settings, setSetting, licenseInfo } = useSettingsStore();
  const isPro = licenseInfo?.tier === "pro";

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-4">Notifications</h2>
      <ToggleRow
        label="Budget alerts"
        description="Notify when you reach your budget threshold"
        value={settings.budgetAlerts}
        onChange={(v) => setSetting("budgetAlerts", v)}
        locked={!isPro}
      />
      <ToggleRow
        label="Weekly summary"
        description="Get a weekly digest of your token usage"
        value={settings.weeklySummary}
        onChange={(v) => setSetting("weeklySummary", v)}
        locked={!isPro}
      />
      <ToggleRow
        label="Reset reminder"
        description="Remind me when my billing period resets"
        value={settings.resetReminder}
        onChange={(v) => setSetting("resetReminder", v)}
      />
    </div>
  );
}
