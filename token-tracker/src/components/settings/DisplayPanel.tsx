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
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
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
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginRight: "auto", fontWeight: 500, fontStyle: "italic" }}>
            Preview
          </span>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Tue 10:41</span>
          <MenuBarItem id={settings.iconStyle as IconStyle} large />
        </div>
      </div>

      {/* Icon Style */}
      <div className="mb-6">
        <p style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>
          Icon Style
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ICON_STYLES.map((style) => {
            const isActive = settings.iconStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSetting("iconStyle", style.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 6px",
                  borderRadius: 10,
                  border: isActive ? "1px solid rgba(240,168,80,0.7)" : "1px solid rgba(255,255,255,0.06)",
                  background: isActive ? "rgba(232,148,58,0.1)" : "rgba(255,255,255,0.02)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <MenuBarItem id={style.id} />
                <span style={{ fontSize: 10.5, color: isActive ? "#f0a850" : "#777", fontWeight: isActive ? 600 : 400 }}>
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Bar Metric */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>
          Menu Bar Metric
        </p>
        <div style={{ position: "relative" }}>
          <select
            value={settings.menuBarMetric}
            onChange={(e) => setSetting("menuBarMetric", e.target.value)}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 8,
              padding: "8px 32px 8px 12px",
              fontSize: 13,
              color: "#e5e5e5",
              outline: "none",
              appearance: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <option value="total_cost">All Providers Total</option>
            <option value="claude_web">Claude Web</option>
            <option value="claude_code">Claude Code</option>
            <option value="openai">OpenAI API</option>
            <option value="openrouter">OpenRouter</option>
            <option value="chatgpt_web">ChatGPT Web</option>
          </select>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5"
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
        <ToggleRow
          label="Show time remaining"
          value={settings.showTimeRemaining}
          onChange={(v) => setSetting("showTimeRemaining", v)}
        />
      </div>
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
    <div className="flex items-center justify-between py-1">
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
