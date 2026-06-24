import { create } from "zustand";
import type { TodaySummary, DailySpend, Subscription, QuickLink } from "../lib/types";
import { api } from "../lib/api";

interface PopupState {
  summary: TodaySummary | null;
  weeklySpend: DailySpend[];
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  isPro: boolean;
  quickLinks: QuickLink[];
  showQuickLinks: boolean;
  refresh: () => Promise<void>;
}

export const usePopupStore = create<PopupState>((set) => ({
  summary: null,
  weeklySpend: [],
  subscriptions: [],
  loading: false,
  error: null,
  isPro: false,
  quickLinks: [],
  showQuickLinks: true,
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      await api.checkAndAdvanceResets();
      const [summary, weeklySpend, subscriptions, isPro, rawSettings] = await Promise.all([
        api.getTodaySummary(),
        api.getWeeklySpend(),
        api.getSubscriptions(),
        api.isPro(),
        api.getSettings(),
      ]);
      const quickLinks: QuickLink[] = (() => {
        try { return JSON.parse(rawSettings.quick_links ?? "[]"); } catch { return []; }
      })();
      const showQuickLinks = rawSettings.show_quick_links !== "false";
      set({ summary, weeklySpend, subscriptions, isPro, quickLinks, showQuickLinks, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
