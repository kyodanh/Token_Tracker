import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Provider } from "../../lib/types";
import { PROVIDER_DISPLAY } from "../../lib/types";
import { api } from "../../lib/api";

const PROVIDER_ICONS: Record<string, ReactNode> = {
  claude_web: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f0a850" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" />
    </svg>
  ),
  chatgpt: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9e" strokeWidth="1.6">
      <path d="M12 3a4 4 0 0 1 3.8 2.7 4 4 0 0 1 2.2 6.9 4 4 0 0 1-2.2 6.9A4 4 0 0 1 12 21a4 4 0 0 1-3.8-1.5 4 4 0 0 1-2.2-6.9A4 4 0 0 1 8.2 5.7 4 4 0 0 1 12 3z" />
    </svg>
  ),
  openrouter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9e" strokeWidth="1.8">
      <path d="M4 7h7l3 3M4 17h7l3-3" />
      <circle cx="18" cy="10" r="2" />
      <circle cx="18" cy="14" r="2" />
    </svg>
  ),
  claude_code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9e" strokeWidth="1.8">
      <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 7l-2 10" />
    </svg>
  ),
  cursor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9e" strokeWidth="1.8">
      <path d="M5 3l14 8-6 1.5L10 19z" />
    </svg>
  ),
  github_copilot: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9e" strokeWidth="1.8">
      <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
    </svg>
  ),
  gemini: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9e" strokeWidth="1.6">
      <path d="M12 3c1 5 4 8 9 9-5 1-8 4-9 9-1-5-4-8-9-9 5-1 8-4 9-9z" />
    </svg>
  ),
  deepseek: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9e" strokeWidth="1.8">
      <path d="M4 12c4-3 6-3 8 0s4 3 8 0M4 8c4-3 6-3 8 0M4 16c4-3 6-3 8 0" />
    </svg>
  ),
};

function ProviderIcon({ id, connected }: { id: string; connected: boolean }) {
  const icon = PROVIDER_ICONS[id] ?? PROVIDER_ICONS.openrouter;
  return (
    <div
      style={{
        width: connected ? 30 : 28,
        height: connected ? 30 : 28,
        borderRadius: 8,
        background: connected ? "rgba(232,148,58,0.14)" : "rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 13,
        background: checked
          ? "linear-gradient(180deg,#f0a850,#e8943a)"
          : "rgba(255,255,255,0.1)",
        position: "relative",
        flexShrink: 0,
        cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? "auto" : 2,
          right: checked ? 2 : "auto",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: checked ? "#fff" : "#6a6a6e",
          boxShadow: checked ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
          transition: "left 0.2s, right 0.2s",
        }}
      />
    </div>
  );
}

const CLAUDE_PLANS = [
  { id: "free",       label: "Free",    sub: "Limited",         cost: null },
  { id: "pro",        label: "Pro",     sub: "$20/mo",          cost: 20 },
  { id: "team",       label: "Team",    sub: "$25/user/mo",     cost: 25 },
  { id: "max_5x",     label: "Max 5x",  sub: "$100/mo",         cost: 100 },
  { id: "max_20x",    label: "Max 20x", sub: "$200/mo",         cost: 200 },
  { id: "enterprise", label: "Enterprise", sub: "Custom",       cost: null },
];

export function ProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [credentials, setCredentials] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, "ok" | "error">>({});
  const [syncError, setSyncError] = useState<Record<string, string>>({});
  const [detectedPlan, setDetectedPlan] = useState<string>("unknown");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const ps = await api.getAllProviders();
    setProviders(ps);
    const creds: Record<string, boolean> = {};
    for (const p of ps) {
      creds[p.id] = p.id === "claude_code" ? true : await api.hasProviderSecret(p.id);
    }
    setCredentials(creds);
    const plan = await api.getClaudePlan();
    setDetectedPlan(plan);
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await api.updateProvider(id, enabled);
    setProviders((ps) => ps.map((p) => (p.id === id ? { ...p, enabled } : p)));
  };

  const syncNow = async (id: string) => {
    setSyncing(id);
    setSyncStatus((s) => { const n = { ...s }; delete (n as Record<string, unknown>)[id]; return n as Record<string, "ok" | "error">; });
    try {
      await api.syncProvider(id);
      setSyncStatus((s) => ({ ...s, [id]: "ok" }));
      setSyncError((s) => { const n = { ...s }; delete n[id]; return n; });
    } catch (e) {
      setSyncStatus((s) => ({ ...s, [id]: "error" }));
      setSyncError((s) => ({ ...s, [id]: String(e) }));
    } finally {
      setSyncing(null);
    }
  };

  const saveSecret = async (id: string) => {
    if (!secretInput.trim()) return;
    setSaving(true);
    try {
      await api.setProviderSecret(id, secretInput.trim());
      setCredentials((c) => ({ ...c, [id]: true }));
      setEditing(null);
      setSecretInput("");
      await syncNow(id);
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async (id: string) => {
    await api.deleteProviderSecret(id);
    setCredentials((c) => ({ ...c, [id]: false }));
    setSyncStatus((s) => ({ ...s, [id]: undefined as unknown as "ok" }));
  };

  return (
    <div
      style={{
        padding: "22px 22px 28px",
        overflowY: "auto",
        height: "100%",
        background: "#1a1a1c",
      }}
    >
      <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 16, color: "#e9e9ec" }}>
        Providers
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {providers.map((p) => {
          const display = PROVIDER_DISPLAY[p.id];
          const connected = credentials[p.id];

          return (
            <div
              key={p.id}
              style={{
                borderRadius: 12,
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderLeft: connected ? "3px solid #e8943a" : "1px solid rgba(255,255,255,0.07)",
                padding: "15px 16px",
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <ProviderIcon id={p.id} connected={!!connected} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: connected ? 14.5 : 14, fontWeight: 600, color: "#e9e9ec" }}>
                    {display?.name ?? p.name}
                  </div>
                  {connected && (
                    <div style={{ fontSize: 12, color: "#8a8a8e", marginTop: 1 }}>
                      {p.id === "claude_web"
                        ? "claude.ai — live rate limits via session key"
                        : display?.name + " — API key"}
                    </div>
                  )}
                </div>
                <Toggle checked={p.enabled} onChange={(v) => toggleEnabled(p.id, v)} />
              </div>

              {/* Connected status row */}
              {connected && p.id !== "claude_code" && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 13,
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "rgba(62,207,142,0.18)",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#3ecf8e" }}>
                      Connected — live data active
                    </div>
                    {syncStatus[p.id] === "error" && (
                      <div style={{ fontSize: 11, color: "#ff7a6e", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                        {syncError[p.id]}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11.5, fontWeight: 600 }}>
                    <button
                      onClick={() => syncNow(p.id)}
                      disabled={syncing === p.id}
                      style={{ color: "#9a9a9e", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      {syncing === p.id ? "⟳" : "Refresh"}
                    </button>
                    <button
                      onClick={() => setEditing(editing === p.id ? null : p.id)}
                      style={{ color: "#9a9a9e", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Change
                    </button>
                    <button
                      onClick={() => disconnect(p.id)}
                      style={{ color: "#ff7a6e", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Connect input (not connected) */}
              {!connected && p.id !== "claude_code" && (
                <div style={{ marginTop: 12 }}>
                  {editing === p.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <p style={{ fontSize: 12, color: "#666" }}>
                        {p.id.includes("web")
                          ? "Open DevTools → Network → copy the Cookie header value from any request."
                          : "Create an API key from your provider dashboard."}
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="password"
                          value={secretInput}
                          onChange={(e) => setSecretInput(e.target.value)}
                          placeholder={p.id.includes("web") ? "Paste session cookie / token..." : "Paste API key..."}
                          style={{
                            flex: 1,
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 13,
                            color: "#e9e9ec",
                            outline: "none",
                          }}
                          onKeyDown={(e) => e.key === "Enter" && saveSecret(p.id)}
                          autoFocus
                        />
                        <button
                          onClick={() => saveSecret(p.id)}
                          disabled={saving || !secretInput.trim()}
                          style={{
                            background: "linear-gradient(180deg,#f0a850,#e8943a)",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#000",
                            cursor: "pointer",
                            opacity: saving || !secretInput.trim() ? 0.4 : 1,
                          }}
                        >
                          {saving ? "..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing(p.id)}
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "#f0a850",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Connect →
                    </button>
                  )}
                </div>
              )}

              {/* Change key input (already connected, editing) */}
              {connected && editing === p.id && p.id !== "claude_code" && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input
                    type="password"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    placeholder="Paste new key..."
                    style={{
                      flex: 1,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 13,
                      color: "#e9e9ec",
                      outline: "none",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && saveSecret(p.id)}
                    autoFocus
                  />
                  <button
                    onClick={() => saveSecret(p.id)}
                    disabled={saving || !secretInput.trim()}
                    style={{
                      background: "linear-gradient(180deg,#f0a850,#e8943a)",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#000",
                      cursor: "pointer",
                      opacity: saving || !secretInput.trim() ? 0.4 : 1,
                    }}
                  >
                    {saving ? "..." : "Update"}
                  </button>
                </div>
              )}

              {/* claude_code auto-detected */}
              {p.id === "claude_code" && (
                <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
                  {/* Auto-detected badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 16, height: 16, borderRadius: "50%",
                      background: "rgba(62,207,142,0.18)", flexShrink: 0,
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#3ecf8e" }}>
                      Auto-detected — reading JSONL files from ~/.claude/projects/
                    </span>
                  </div>

                  {/* Plan selector */}
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.5px", color: "#6a6a6e", marginBottom: 7 }}>
                    YOUR CLAUDE PLAN
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {CLAUDE_PLANS.filter(pl => pl.id !== "enterprise" || detectedPlan === "enterprise").map((pl) => {
                      const isActive = detectedPlan === pl.id;
                      return (
                        <div
                          key={pl.id}
                          style={{
                            borderRadius: 8,
                            padding: "6px 10px",
                            background: isActive
                              ? "linear-gradient(180deg,#f0a850,#e8943a)"
                              : "rgba(255,255,255,0.05)",
                            border: isActive
                              ? "1px solid #f0a850"
                              : "1px solid rgba(255,255,255,0.09)",
                            cursor: "default",
                            minWidth: 52,
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? "#000" : "#c0c0c4", lineHeight: 1.2 }}>
                            {pl.label}
                          </div>
                          <div style={{ fontSize: 10, color: isActive ? "#3a2800" : "#6a6a6e", marginTop: 2, lineHeight: 1 }}>
                            {pl.sub}
                          </div>
                        </div>
                      );
                    })}
                    {detectedPlan === "unknown" && (
                      <span style={{ fontSize: 11.5, color: "#6a6a6e", alignSelf: "center" }}>
                        Plan not detected
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
