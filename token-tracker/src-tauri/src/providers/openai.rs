use anyhow::{anyhow, Result};
use async_trait::async_trait;
use serde::Deserialize;
use chrono::Local;
use crate::models::NewSnapshot;
use super::Provider;

pub struct OpenAiProvider;

#[derive(Deserialize, Debug)]
struct UsageResponse {
    data: Vec<UsageDay>,
}

#[derive(Deserialize, Debug, Default)]
struct UsageDay {
    #[serde(default)]
    n_context_tokens_total: i64,
    #[serde(default)]
    n_generated_tokens_total: i64,
    #[serde(default)]
    aggregation_timestamp: i64,
}

#[async_trait]
impl Provider for OpenAiProvider {
    fn id(&self) -> &str {
        "openai"
    }

    async fn fetch(&self, secret: &str) -> Result<NewSnapshot> {
        let today = Local::now().format("%Y-%m-%d").to_string();
        let client = reqwest::Client::new();

        let resp = client
            .get(format!("https://api.openai.com/v1/usage?date={today}"))
            .header("Authorization", format!("Bearer {secret}"))
            .send()
            .await?;

        if resp.status() == 401 {
            return Err(anyhow!("session_expired"));
        }

        let raw = resp.text().await?;
        let parsed: UsageResponse = serde_json::from_str(&raw)?;

        let total_input: i64 = parsed.data.iter().map(|d| d.n_context_tokens_total).sum();
        let total_output: i64 = parsed.data.iter().map(|d| d.n_generated_tokens_total).sum();
        let total_tokens = total_input + total_output;

        let cost = (total_input as f64 / 1_000_000.0) * 2.5
            + (total_output as f64 / 1_000_000.0) * 10.0;

        Ok(NewSnapshot {
            provider_id: "openai".into(),
            snapshot_type: "daily".into(),
            tokens_used: Some(total_tokens),
            tokens_limit: None,
            cost_usd: Some(cost),
            raw_json: Some(raw),
            account_label: None,
        })
    }
}
