use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Provider {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub keychain_key: Option<String>,
    pub last_synced_at: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UsageSnapshot {
    pub id: i64,
    pub provider_id: String,
    pub snapshot_type: String,
    pub tokens_used: Option<i64>,
    pub tokens_limit: Option<i64>,
    pub cost_usd: Option<f64>,
    pub raw_json: Option<String>,
    pub captured_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DailySpend {
    pub id: i64,
    pub provider_id: String,
    pub date: String,
    pub tokens_used: i64,
    pub cost_usd: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Subscription {
    pub id: i64,
    pub provider_id: String,
    pub plan_name: Option<String>,
    pub cost_usd: Option<f64>,
    pub billing_cycle: Option<String>,
    pub next_reset_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProviderSummary {
    pub provider: Provider,
    pub snapshot: Option<UsageSnapshot>,
    pub usage_percent: Option<f64>,
    pub weekly_usage_percent: Option<f64>,
    pub weekly_resets_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TodaySummary {
    pub providers: Vec<ProviderSummary>,
    pub total_cost_usd: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LicenseInfo {
    pub tier: String,
    pub activated_at: Option<i64>,
    pub key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NewSnapshot {
    pub provider_id: String,
    pub snapshot_type: String,
    pub tokens_used: Option<i64>,
    pub tokens_limit: Option<i64>,
    pub cost_usd: Option<f64>,
    pub raw_json: Option<String>,
}
