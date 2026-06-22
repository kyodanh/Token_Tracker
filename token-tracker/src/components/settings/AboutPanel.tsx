export function AboutPanel() {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-sm font-semibold text-[#e5e5e5] mb-6">About</h2>
      <div className="space-y-4">
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🍵</div>
          <p className="text-base font-semibold text-[#e5e5e5]">TokenTracker</p>
          <p className="text-xs text-[#666] mt-1">Version 0.1.0</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
          <p className="text-xs text-[#666] leading-relaxed">
            <span className="text-green-400 font-semibold">🔒 Privacy-first:</span> No data ever leaves your device.
            All usage data is stored locally in SQLite. API keys and session tokens are stored exclusively in your
            macOS Keychain / Windows Credential Manager. No cloud backend, no telemetry, no analytics.
          </p>
        </div>

        <div className="space-y-2">
          <a
            href="https://github.com/tokentracker/tokentracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
          >
            GitHub →
          </a>
        </div>
      </div>
    </div>
  );
}
