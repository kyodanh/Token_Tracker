import { useState } from "react";
import { useSettingsStore } from "../../store/settings";
import type { QuickLink } from "../../lib/types";

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 16,
      }}
    >
      <div style={{ flex: 1, paddingRight: 16 }}>
        <p style={{ fontSize: 13, color: "#e5e5e5", fontWeight: 500, margin: 0 }}>{label}</p>
        {description && (
          <p style={{ fontSize: 11.5, color: "#555", marginTop: 3, margin: 0 }}>{description}</p>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer" style={{ flexShrink: 0 }}>
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

const BTN_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 7,
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 500,
  transition: "background 0.15s",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 7,
  color: "#e0e0e4",
  fontSize: 13,
  padding: "7px 10px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const ICON_BTN: React.CSSProperties = {
  ...BTN_BASE,
  width: 30,
  height: 30,
  padding: 0,
  background: "transparent",
  color: "#6a6a6e",
  flexShrink: 0,
  borderRadius: 7,
};

function LinkRow({ link, onEdit, onDelete }: { link: QuickLink; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 10px",
        borderRadius: 9,
        background: "rgba(255,255,255,0.03)",
        marginBottom: 5,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: "rgba(232,148,58,0.1)",
          border: "1px solid rgba(232,148,58,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f0a850" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#e0e0e4", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {link.name}
        </div>
        <div style={{ fontSize: 11, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
          {link.url}
        </div>
      </div>
      <button
        onClick={onEdit}
        title="Edit"
        style={ICON_BTN}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        style={{ ...ICON_BTN, color: "#c04040" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(192,64,64,0.1)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}

function EditRow({ link, onSave, onCancel }: { link: QuickLink; onSave: (id: string, name: string, url: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);

  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 13, marginBottom: 6, border: "1px solid rgba(232,148,58,0.2)" }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={INPUT_STYLE} />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL"
        onKeyDown={(e) => { if (e.key === "Enter") onSave(link.id, name, url); }}
        style={{ ...INPUT_STYLE, marginTop: 7 }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button
          onClick={() => onSave(link.id, name, url)}
          style={{ ...BTN_BASE, padding: "6px 16px", background: "#f0a850", color: "#1a1a1c", fontSize: 12.5 }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          style={{ ...BTN_BASE, padding: "6px 16px", background: "rgba(255,255,255,0.06)", color: "#9a9a9e", fontSize: 12.5 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function QuickLinksPanel() {
  const { settings, setSetting, quickLinks, setQuickLinks } = useSettingsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name || !url) return;
    await setQuickLinks([...quickLinks, { id: crypto.randomUUID(), name, url }]);
    setNewName("");
    setNewUrl("");
    setAdding(false);
  };

  const handleDelete = (id: string) => setQuickLinks(quickLinks.filter((l) => l.id !== id));

  const handleSaveEdit = (id: string, name: string, url: string) => {
    setQuickLinks(quickLinks.map((l) => l.id === id ? { ...l, name: name.trim(), url: url.trim() } : l));
    setEditingId(null);
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-4">Quick Links</h2>

      <ToggleRow
        label="Show in popup"
        description="Display quick links section in the popup window"
        value={settings.showQuickLinks}
        onChange={(v) => setSetting("showQuickLinks", v)}
      />

      {/* Links section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Links ({quickLinks.length})
          </span>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              style={{
                ...BTN_BASE,
                padding: "5px 12px",
                background: "rgba(232,148,58,0.12)",
                color: "#f0a850",
                fontSize: 12.5,
                gap: 5,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(232,148,58,0.22)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(232,148,58,0.12)")}
            >
              + Add Link
            </button>
          )}
        </div>

        {adding && (
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 13, marginBottom: 10, border: "1px solid rgba(255,255,255,0.09)" }}>
            <input
              autoFocus
              placeholder="Name (e.g. GitHub)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={INPUT_STYLE}
            />
            <input
              placeholder="URL (e.g. github.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              style={{ ...INPUT_STYLE, marginTop: 7 }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !newUrl.trim()}
                style={{
                  ...BTN_BASE,
                  padding: "6px 16px",
                  background: "#f0a850",
                  color: "#1a1a1c",
                  fontSize: 12.5,
                  opacity: (!newName.trim() || !newUrl.trim()) ? 0.4 : 1,
                }}
              >
                Add
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(""); setNewUrl(""); }}
                style={{ ...BTN_BASE, padding: "6px 16px", background: "rgba(255,255,255,0.06)", color: "#9a9a9e", fontSize: 12.5 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {quickLinks.length === 0 && !adding && (
          <div
            style={{
              textAlign: "center",
              padding: "28px 20px",
              borderRadius: 10,
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔗</div>
            <p style={{ fontSize: 13, color: "#444", marginBottom: 4 }}>No links yet</p>
            <p style={{ fontSize: 11.5, color: "#383838" }}>Add quick links to open them directly from the popup</p>
          </div>
        )}

        {quickLinks.map((link) =>
          editingId === link.id
            ? <EditRow key={link.id} link={link} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
            : <LinkRow key={link.id} link={link} onEdit={() => setEditingId(link.id)} onDelete={() => handleDelete(link.id)} />
        )}
      </div>
    </div>
  );
}
