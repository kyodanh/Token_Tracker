type Section =
  | "providers"
  | "subscriptions"
  | "budgets"
  | "display"
  | "notifications"
  | "license"
  | "about";

const NAV: { id: Section; label: string }[] = [
  { id: "providers", label: "Providers" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "budgets", label: "Budgets" },
  { id: "display", label: "Display" },
  { id: "notifications", label: "Notifications" },
  { id: "license", label: "License" },
  { id: "about", label: "About" },
];

interface Props {
  active: Section;
  onChange: (s: Section) => void;
  isPro: boolean;
}

export function Sidebar({ active, onChange, isPro }: Props) {
  return (
    <div className="w-40 flex-shrink-0 bg-[#141414] border-r border-[#2a2a2a] flex flex-col h-full">
      <div className="px-4 py-4 border-b border-[#2a2a2a]">
        <span className="text-amber-400 font-semibold text-sm">🍵 TokenTracker</span>
      </div>
      <nav className="flex-1 py-2">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              active === item.id
                ? "text-amber-400 bg-[#1a1a1a] border-r-2 border-amber-400"
                : "text-[#888] hover:text-[#e5e5e5]"
            }`}
          >
            {active === item.id ? "▶ " : "  "}
            {item.label}
          </button>
        ))}
      </nav>
      {!isPro && (
        <div className="p-3 border-t border-[#2a2a2a]">
          <button
            onClick={() => onChange("license")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold py-1.5 rounded transition-colors"
          >
            ★ Get Pro — $7.99
          </button>
        </div>
      )}
    </div>
  );
}

export type { Section };
