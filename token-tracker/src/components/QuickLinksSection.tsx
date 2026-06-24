import { openUrl } from "@tauri-apps/plugin-opener";
import type { QuickLink } from "../lib/types";

interface Props {
  links: QuickLink[];
}

export function QuickLinksSection({ links }: Props) {
  if (links.length === 0) return null;

  const openLink = (url: string) => {
    let href = url.trim();
    if (href && !/^https?:\/\//i.test(href)) href = `https://${href}`;
    openUrl(href).catch(() => {});
  };

  return (
    <div style={{ padding: "0 16px 12px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6a6a6e", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
        Quick Links
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => openLink(link.url)}
            title={link.url}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              borderRadius: 7,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#d0d0d4",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.6 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {link.name}
          </button>
        ))}
      </div>
    </div>
  );
}
