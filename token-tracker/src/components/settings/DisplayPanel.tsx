import { useSettingsStore } from "../../store/settings";
import type { IconStyle } from "../../lib/types";

const ICON_STYLES: { id: IconStyle; label: string; preview: string }[] = [
  { id: "icon_only", label: "Icon", preview: "🍵" },
  { id: "icon_cost", label: "Icon+Cost", preview: "🍵 $0.5" },
  { id: "icon_usage", label: "Icon+Usage%", preview: "🍵 10%" },
  { id: "usage_only", label: "Usage %", preview: "10%" },
  { id: "progress", label: "Progress", preview: "████░" },
  { id: "compact_dot", label: "Compact dot", preview: "●" },
];

export function DisplayPanel() {
  const { settings, setSetting } = useSettingsStore();

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-4">Display</h2>

      <div className="mb-6">
        <p className="text-xs text-[#666] uppercase tracking-wide mb-3">Icon Style</p>
        <div className="grid grid-cols-3 gap-2">
          {ICON_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSetting("iconStyle", style.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                settings.iconStyle === style.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
              }`}
            >
              <span className="text-base font-mono">{style.preview}</span>
              <span className="text-[10px] text-[#888]">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-[#666] uppercase tracking-wide mb-3">Menu Bar Metric</p>
        <select
          value={settings.menuBarMetric}
          onChange={(e) => setSetting("menuBarMetric", e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#e5e5e5] focus:outline-none focus:border-amber-500"
        >
          <option value="total_cost">All Providers Total</option>
          <option value="claude_web">Claude Web</option>
          <option value="claude_code">Claude Code</option>
          <option value="openai">OpenAI API</option>
          <option value="openrouter">OpenRouter</option>
          <option value="chatgpt_web">ChatGPT Web</option>
        </select>
      </div>

      <ToggleRow
        label="Show time remaining"
        value={settings.showTimeRemaining}
        onChange={(v) => setSetting("showTimeRemaining", v)}
      />
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#e5e5e5]">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-[#333] peer-checked:bg-amber-500 rounded-full transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
      </label>
    </div>
  );
}
