import { create } from "zustand";
import type { AppSettings, IconStyle, LicenseInfo } from "../lib/types";
import { DEFAULT_SETTINGS } from "../lib/types";
import { api } from "../lib/api";

interface SettingsState {
  settings: AppSettings;
  licenseInfo: LicenseInfo | null;
  loaded: boolean;
  load: () => Promise<void>;
  setSetting: (key: keyof AppSettings, value: string | boolean) => Promise<void>;
  setLicenseInfo: (info: LicenseInfo) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  licenseInfo: null,
  loaded: false,
  load: async () => {
    const [rawSettings, licenseInfo] = await Promise.all([
      api.getSettings(),
      api.getLicenseInfo(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const settings: AppSettings = {
      iconStyle: (rawSettings.icon_style as IconStyle) ?? DEFAULT_SETTINGS.iconStyle,
      menuBarMetric: rawSettings.menu_bar_metric ?? DEFAULT_SETTINGS.menuBarMetric,
      showTimeRemaining: rawSettings.show_time_remaining === "true",
      budgetAlerts: rawSettings.budget_alerts !== "false",
      weeklySummary: rawSettings.weekly_summary === "true",
      resetReminder: rawSettings.reset_reminder === "true",
    };
    set({ settings, licenseInfo, loaded: true });
  },
  setSetting: async (key, value) => {
    const snake = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    try {
      await api.setSetting(snake, String(value));
    } catch (e) {
      console.error("setSetting failed:", e);
    }
    set((s) => ({ settings: { ...s.settings, [key]: value } }));
    if (key === "iconStyle") {
      api.refreshTray().catch(() => {});
    }
  },
  setLicenseInfo: (info) => set({ licenseInfo: info }),
}));
