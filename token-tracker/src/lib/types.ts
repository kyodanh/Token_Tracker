export interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  keychainKey: string | null;
  lastSyncedAt: number | null;
  createdAt: number;
  accountLabel: string | null;
}

export interface UsageSnapshot {
  id: number;
  providerId: string;
  snapshotType: "session" | "daily" | "weekly";
  tokensUsed: number | null;
  tokensLimit: number | null;
  costUsd: number | null;
  rawJson: string | null;
  capturedAt: number;
}

export interface DailySpend {
  id: number;
  providerId: string;
  date: string;
  tokensUsed: number;
  costUsd: number;
}

export interface Subscription {
  id: number;
  providerId: string;
  planName: string | null;
  costUsd: number | null;
  billingCycle: "monthly" | "annual" | null;
  nextResetAt: number | null;
}

export interface ProviderSummary {
  provider: Provider;
  snapshot: UsageSnapshot | null;
  usagePercent: number | null;
  weeklyUsagePercent: number | null;
  weeklyResetsAt: string | null;
}

export interface TodaySummary {
  providers: ProviderSummary[];
  totalCostUsd: number;
}

export interface LicenseInfo {
  tier: "free" | "pro";
  activatedAt: number | null;
  key: string | null;
}

export type IconStyle =
  | "icon_only"
  | "icon_cost"
  | "icon_usage"
  | "usage_only"
  | "progress"
  | "compact_dot";

export interface AppSettings {
  iconStyle: IconStyle;
  menuBarMetric: string;
  showTimeRemaining: boolean;
  budgetAlerts: boolean;
  weeklySummary: boolean;
  resetReminder: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  iconStyle: "icon_only",
  menuBarMetric: "total_cost",
  showTimeRemaining: false,
  budgetAlerts: true,
  weeklySummary: false,
  resetReminder: false,
};

export const PROVIDER_DISPLAY: Record<string, { name: string; icon: string; color: string }> = {
  claude_web: { name: "Claude Web", icon: "🤖", color: "#f59e0b" },
  claude_code: { name: "Claude Code", icon: "💻", color: "#8b5cf6" },
  openai: { name: "OpenAI API", icon: "🟢", color: "#10b981" },
  openrouter: { name: "OpenRouter", icon: "🔀", color: "#3b82f6" },
  chatgpt_web: { name: "ChatGPT Web", icon: "💬", color: "#10a37f" },
};
