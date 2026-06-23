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

  // Tray
  refreshTray: () => invoke<void>("trigger_tray_refresh"),

  // Window
  openSettings: () => invoke<void>("open_settings_window"),
};
