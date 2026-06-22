import { useState } from "react";
import { useSettingsStore } from "../../store/settings";
import { api } from "../../lib/api";

export function LicensePanel() {
  const { licenseInfo, setLicenseInfo } = useSettingsStore();
  const [keyInput, setKeyInput] = useState("");
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = licenseInfo?.tier === "pro";

  const activate = async () => {
    if (!keyInput.trim()) return;
    setActivating(true);
    setError(null);
    try {
      const info = await api.activateLicense(keyInput.trim());
      setLicenseInfo(info);
      setKeyInput("");
    } catch (e) {
      setError(String(e));
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-6">License</h2>

      <div className={`rounded-lg p-4 mb-6 border ${isPro ? "border-green-500/30 bg-green-500/5" : "border-[#2a2a2a] bg-[#1a1a1a]"}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${isPro ? "bg-green-500" : "bg-[#444]"}`} />
          <span className={`text-sm font-semibold ${isPro ? "text-green-400" : "text-[#888]"}`}>
            {isPro ? "Pro Active" : "Free Plan"}
          </span>
        </div>
        <p className="text-xs text-[#666]">
          {isPro
            ? `All 5 providers unlocked. Activated: ${licenseInfo?.activatedAt ? new Date(licenseInfo.activatedAt * 1000).toLocaleDateString() : "—"}`
            : "1 provider included. Upgrade for all 5 providers + budgets + notifications."}
        </p>
      </div>

      {!isPro && (
        <>
          <div className="mb-6">
            <p className="text-xs text-[#666] mb-2">License key</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="flex-1 bg-[#0f0f0f] border border-[#3a3a3a] rounded px-3 py-2 text-sm text-[#e5e5e5] placeholder-[#555] focus:outline-none focus:border-amber-500"
                onKeyDown={(e) => e.key === "Enter" && activate()}
              />
              <button
                onClick={activate}
                disabled={activating || !keyInput.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm px-4 py-2 rounded"
              >
                {activating ? "..." : "Activate"}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <div className="border-t border-[#2a2a2a] pt-4">
            <p className="text-xs text-[#666] mb-3">Don't have a license?</p>
            <a
              href="https://tokentracker.gumroad.com/l/pro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-5 py-2 rounded"
            >
              ★ Buy Pro — $7.99 one-time
            </a>
            <p className="text-xs text-[#666] mt-2">One-time payment, lifetime license.</p>
          </div>
        </>
      )}
    </div>
  );
}
