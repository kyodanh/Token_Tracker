import { useState, useEffect } from "react";
import type { Provider } from "../../lib/types";
import { PROVIDER_DISPLAY } from "../../lib/types";
import { api } from "../../lib/api";

export function ProvidersPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [credentials, setCredentials] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, "ok" | "error">>({});
  const [syncError, setSyncError] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const ps = await api.getAllProviders();
    setProviders(ps);
    const creds: Record<string, boolean> = {};
    for (const p of ps) {
      if (p.id !== "claude_code") {
        creds[p.id] = await api.hasProviderSecret(p.id);
      } else {
        creds[p.id] = true;
      }
    }
    setCredentials(creds);
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await api.updateProvider(id, enabled);
    setProviders((ps) => ps.map((p) => (p.id === id ? { ...p, enabled } : p)));
  };

  const syncNow = async (id: string) => {
    setSyncing(id);
    setSyncStatus((s) => { const n = {...s}; delete (n as Record<string, unknown>)[id]; return n as Record<string, "ok"|"error">; });
    try {
      await api.syncProvider(id);
      setSyncStatus((s) => ({ ...s, [id]: "ok" }));
      setSyncError((s) => { const n = {...s}; delete n[id]; return n; });
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
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-base font-semibold text-[#e5e5e5] mb-4">Providers</h2>
      <div className="space-y-3">
        {providers.map((p) => {
          const display = PROVIDER_DISPLAY[p.id];
          const connected = credentials[p.id];
          return (
            <div key={p.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${connected ? "bg-green-500" : "bg-[#444]"}`} />
                  <span className="text-sm font-medium text-[#e5e5e5]">{display?.name ?? p.name}</span>
                  {p.id === "claude_code" && (
                    <span className="text-xs text-[#555] ml-1">auto-detected</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Sync status badge */}
                  {syncStatus[p.id] === "ok" && (
                    <span className="text-[10px] text-green-400 font-medium">✓ synced</span>
                  )}
                  {syncStatus[p.id] === "error" && (
                    <span className="text-[10px] text-red-400 font-medium">✗ failed</span>
                  )}
                  {/* Sync now button for connected providers */}
                  {connected && p.id !== "claude_code" && (
                    <button
                      onClick={() => syncNow(p.id)}
                      disabled={syncing === p.id}
                      className="text-[11px] text-[#888] hover:text-[#e5e5e5] disabled:opacity-40 transition-colors px-1"
                      title="Sync now"
                    >
                      {syncing === p.id ? "⟳" : "↺ Sync"}
                    </button>
                  )}
                  {p.id !== "claude_code" && (
                    <button
                      onClick={() => connected ? disconnect(p.id) : setEditing(p.id === editing ? null : p.id)}
                      className={`text-sm font-medium px-2 py-0.5 rounded ${connected ? "text-red-400 hover:text-red-300" : "text-amber-400 hover:text-amber-300"}`}
                    >
                      {connected ? "Disconnect" : editing === p.id ? "Cancel" : "Connect"}
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => toggleEnabled(p.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#333] peer-checked:bg-amber-500 rounded-full peer transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
                  </label>
                </div>
              </div>
              {syncError[p.id] && (
                <p className="mt-1.5 text-[10px] text-red-400 font-mono break-all">{syncError[p.id]}</p>
              )}
              {editing === p.id && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-[#666]">
                    {p.id.includes("web")
                      ? "Open DevTools → Network → copy the Cookie header value from any request."
                      : "Create an API key from your provider dashboard."}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      placeholder={p.id.includes("web") ? "Paste session cookie / token..." : "Paste API key..."}
                      className="flex-1 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#555] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                      onKeyDown={(e) => e.key === "Enter" && saveSecret(p.id)}
                      autoFocus
                    />
                    <button
                      onClick={() => saveSecret(p.id)}
                      disabled={saving || !secretInput.trim()}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                    >
                      {saving ? "..." : "Save"}
                    </button>
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
