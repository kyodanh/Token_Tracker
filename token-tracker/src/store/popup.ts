import { create } from "zustand";
import type { TodaySummary, DailySpend, Subscription } from "../lib/types";
import { api } from "../lib/api";

interface PopupState {
  summary: TodaySummary | null;
  weeklySpend: DailySpend[];
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  isPro: boolean;
  refresh: () => Promise<void>;
}

export const usePopupStore = create<PopupState>((set) => ({
  summary: null,
  weeklySpend: [],
  subscriptions: [],
  loading: false,
  error: null,
  isPro: false,
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [summary, weeklySpend, subscriptions, isPro] = await Promise.all([
        api.getTodaySummary(),
        api.getWeeklySpend(),
        api.getSubscriptions(),
        api.isPro(),
      ]);
      set({ summary, weeklySpend, subscriptions, isPro, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
