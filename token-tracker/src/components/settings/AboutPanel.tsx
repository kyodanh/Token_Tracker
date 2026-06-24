export function AboutPanel() {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-6">About</h2>

      {/* App identity */}
      <div
        style={{
          borderRadius: 14,
          background: "linear-gradient(145deg, rgba(232,148,58,0.08) 0%, rgba(255,255,255,0.03) 100%)",
          border: "1px solid rgba(232,148,58,0.15)",
          padding: "24px 20px",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "rgba(232,148,58,0.12)",
            border: "1px solid rgba(232,148,58,0.2)",
            fontSize: 36,
            marginBottom: 12,
          }}
        >
          🍵
        </div>
        <p style={{ fontSize: 17, fontWeight: 700, color: "#e9e9ec", letterSpacing: "-0.3px" }}>
          TokenTracker
        </p>
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Version 0.1.0</p>
      </div>

      {/* Privacy note */}
      <div
        style={{
          borderRadius: 10,
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.15)",
          padding: "12px 14px",
          marginBottom: 16,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
        <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6, margin: 0 }}>
          <span style={{ color: "#4ade80", fontWeight: 600 }}>Privacy-first: </span>
          No data ever leaves your device. All usage data is stored locally in SQLite. API keys and
          session tokens are stored exclusively in your macOS Keychain / Windows Credential Manager.
          No cloud backend, no telemetry, no analytics.
        </p>
      </div>

      {/* Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <a
          href="https://github.com/kyodanh/QAssit/actions"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderRadius: 9,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)")}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#ccc" }}>
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            <span style={{ fontSize: 13, color: "#e0e0e4", fontWeight: 500 }}>GitHub</span>
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </a>
      </div>
    </div>
  );
}
