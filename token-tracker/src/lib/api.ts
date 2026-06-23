import { invoke } from "@tauri-apps/api/core";
import type {
  Provider,
  UsageSnapshot,
  DailySpend,
  Subscription,
  TodaySummary,
  LicenseInfo,
} from "./types";

export const api = {
  // Providers
  getAllProviders: () => invoke<Provider[]>("get_all_providers"),
  updateProvider: (id: string, enabled: boolean) =>
    invoke<void>("update_provider", { id, enabled }),

  // Usage
  getTodaySummary: () => invoke<TodaySummary>("get_today_summary"),
  getWeeklySpend: () => invoke<DailySpend[]>("get_weekly_spend"),
  getLatestSnapshot: (providerId: string) =>
    invoke<UsageSnapshot | null>("get_latest_snapshot", { providerId }),

  // Subscriptions
  getSubscriptions: () => invoke<Subscription[]>("get_subscriptions"),
  upsertSubscription: (sub: Omit<Subscription, "id"> & { id?: number }) =>
    invoke<void>("upsert_subscription", { sub: { id: sub.id ?? 0, ...sub } }),
  deleteSubscription: (id: number) => invoke<void>("delete_subscription", { id }),
  checkAndAdvanceResets: () => invoke<number[]>("check_and_advance_resets"),

  // Settings
  getSettings: () => invoke<Record<string, string>>("get_settings"),
  setSetting: (key: string, value: string) =>
    invoke<void>("set_setting", { key, value }),

  // Keychain
  setProviderSecret: (providerId: string, secret: string) =>
    invoke<void>("set_provider_secret", { providerId, secret }),
  hasProviderSecret: (providerId: string) =>
    invoke<boolean>("has_provider_secret", { providerId }),
  deleteProviderSecret: (providerId: string) =>
    invoke<void>("delete_provider_secret", { providerId }),

  // Sync
  syncProvider: (providerId: string) =>
    invoke<void>("sync_provider", { providerId }),
  syncAllProviders: () => invoke<void>("sync_all_providers"),

  // License
  getLicenseInfo: () => invoke<LicenseInfo>("get_license_info"),
  activateLicense: (key: string) =>
    invoke<LicenseInfo>("activate_license", { key }),
  isPro: () => invoke<boolean>("is_pro"),

  // Claude Code
  getClaudePlan: () => invoke<string>("get_claude_plan"),
  addClaudeCodeAccount: (label: string, configPath: string) =>
    invoke<string>("add_claude_code_account", { label, configPath }),
  removeClaudeCodeAccount: (id: string) =>
    invoke<void>("remove_claude_code_account", { id }),
  getClaudeCodeConfigPath: (id: string) =>
    invoke<string | null>("get_claude_code_config_path", { id }),
  startClaudeLogin: (label: string) =>
    invoke<string>("start_claude_login", { label }),
  checkClaudeLoginStatus: (configPath: string) =>
    invoke<{ loggedIn: boolean; email: string | null; orgName: string | null; subscriptionType: string | null; configPath: string }>("check_claude_login_status", { configPath }),
  scanClaudeCodeDirs: () =>
    invoke<Array<{ loggedIn: boolean; email: string | null; orgName: string | null; subscriptionType: string | null; configPath: string }>>("scan_claude_code_dirs"),

  // Claude Web
  addClaudeWebAccount: (label: string, sessionKey: string) =>
    invoke<string>("add_claude_web_account", { label, sessionKey }),
  removeClaudeWebAccount: (id: string) =>
    invoke<void>("remove_claude_web_account", { id }),

  // Tray
  refreshTray: () => invoke<void>("trigger_tray_refresh"),

  // Window
  openSettings: () => invoke<void>("open_settings_window"),
};
