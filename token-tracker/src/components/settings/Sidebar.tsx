import type { ReactNode } from "react";

type Section =
  | "providers"
  | "subscriptions"
  | "budgets"
  | "display"
  | "notifications"
  | "license"
  | "about";

const NAV: { id: Section; label: string; icon: ReactNode }[] = [
  {
    id: "providers",
    label: "Providers",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    id: "budgets",
    label: "Budgets",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    id: "display",
    label: "Display",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h6v12M3 9V3" />
      </svg>
    ),
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
  {
    id: "license",
    label: "License",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="15" r="4" />
        <path d="M10.85 12.15 19 4l2 2-2 2 1.5 1.5L18 12l-1.5-1.5L14 13" />
      </svg>
    ),
  },
  {
    id: "about",
    label: "About",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
];

interface Props {
  active: Section;
  onChange: (s: Section) => void;
  isPro: boolean;
}

export function Sidebar({ active, onChange }: Props) {
  return (
    <div
      style={{
        width: 172,
        flexShrink: 0,
        background: "#1d1d1f",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "14px 12px",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 8px 16px" }}>
        <span style={{ fontSize: 20 }}>🥞</span>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px", color: "#e9e9ec" }}>T4B</span>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                background: isActive ? "rgba(232,148,58,0.16)" : "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#f0a850" : "#c0c0c4",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                textAlign: "left",
                width: "100%",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export type { Section };
