import { useSettingsStore } from "../../store/settings";
import type { IconStyle } from "../../lib/types";

const PANCAKE = "🥞";

function MenuBarItem({ id, large = false }: { id: IconStyle; large?: boolean }) {
  const iconSize = large ? 18 : 15;
  const textSize = large ? 14 : 12;

  const inner = (() => {
    switch (id) {
      case "icon_only":
        return <span style={{ fontSize: iconSize, lineHeight: 1 }}>{PANCAKE}</span>;
      case "icon_cost":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: textSize, fontWeight: 500 }}>
            <span style={{ fontSize: iconSize, lineHeight: 1 }}>{PANCAKE}</span>
            <span style={{ color: "#f0a850", fontWeight: 600 }}>$0.5</span>
          </span>
        );
      case "icon_usage":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: textSize, fontWeight: 500 }}>
            <span style={{ fontSize: iconSize, lineHeight: 1 }}>{PANCAKE}</span>
            <span style={{ color: "#f0a850", fontWeight: 600 }}>10%</span>
          </span>
        );
      case "usage_only":
        return <span style={{ fontSize: textSize, fontWeight: 700, color: "#f0a850" }}>10%</span>;
      case "progress": {
        const filled = 2;
        const barH = large ? 14 : 11;
        const barW = large ? 7 : 5;
        return (
          <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  width: barW,
                  height: barH,
                  borderRadius: 2,
                  background: i < filled ? "#f0a850" : "rgba(255,255,255,0.18)",
                }}
              />
            ))}
          </span>
        );
      }
      case "compact_dot":
        return (
          <span
            style={{
              width: large ? 12 : 9,
              height: large ? 12 : 9,
              borderRadius: "50%",
              background: "#f0a850",
              display: "inline-block",
              boxShadow: "0 0 6px rgba(240,168,80,0.6)",
            }}
          />
        );
    }
  })();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: large ? 28 : 24,
        padding: large ? "0 10px" : "0 8px",
        borderRadius: large ? 8 : 7,
        background: large
          ? "rgba(20,18,28,0.92)"
          : "rgba(255,255,255,0.07)",
        border: large
          ? "1px solid rgba(255,255,255,0.12)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: large ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
        color: "#e9e9ec",
        userSelect: "none",
      }}
    >
      {inner}
    </div>
  );
}

const ICON_STYLES: { id: IconStyle; label: string }[] = [
  { id: "icon_only", label: "Icon" },
  { id: "icon_cost", label: "Icon+Cost" },
  { id: "icon_usage", label: "Icon+Usage%" },
  { id: "usage_only", label: "Usage %" },
  { id: "progress", label: "Progress" },
  { id: "compact_dot", label: "Compact dot" },
];

export function DisplayPanel() {
  const { settings, setSetting } = useSettingsStore();

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-4">Display</h2>

      {/* Live menu bar preview */}
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 20,
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Fake macOS menu bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
            background: "linear-gradient(180deg, #3a2a5a 0%, #2a1f45 100%)",
            padding: "5px 12px",
            height: 38,
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginRight: "auto", fontWeight: 500 }}>Preview</span>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Tue 10:41</span>
          <MenuBarItem id={settings.iconStyle as IconStyle} large />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-[#666] uppercase tracking-wide mb-3">Icon Style</p>
        <div className="grid grid-cols-3 gap-2">
          {ICON_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSetting("iconStyle", style.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                settings.iconStyle === style.id
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]"
              }`}
            >
              <MenuBarItem id={style.id} />
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
