use anyhow::{anyhow, Result};
use async_trait::async_trait;
use serde::Deserialize;
use crate::models::NewSnapshot;
use super::Provider;

pub struct OpenRouterProvider;

#[derive(Deserialize, Debug)]
struct KeyResponse {
    data: KeyData,
}

#[derive(Deserialize, Debug)]
struct KeyData {
    #[serde(default)]
    usage: f64,
    #[serde(default)]
    limit: Option<f64>,
    #[serde(default)]
    is_free_tier: bool,
}

#[async_trait]
impl Provider for OpenRouterProvider {
    fn id(&self) -> &str {
        "openrouter"
    }

    async fn fetch(&self, secret: &str) -> Result<NewSnapshot> {
        let client = reqwest::Client::new();
        let resp = client
            .get("https://openrouter.ai/api/v1/auth/key")
            .header("Authorization", format!("Bearer {secret}"))
            .send()
            .await?;

        if resp.status() == 401 {
            return Err(anyhow!("session_expired"));
        }

        let raw = resp.text().await?;
        let parsed: KeyResponse = serde_json::from_str(&raw)?;

        let cost_usd = parsed.data.usage;
        let limit_tokens = parsed.data.limit.map(|l| (l * 1_000_000.0) as i64);

        Ok(NewSnapshot {
            provider_id: "openrouter".into(),
            snapshot_type: "session".into(),
            tokens_used: None,
            tokens_limit: limit_tokens,
            cost_usd: Some(cost_usd),
            raw_json: Some(raw),
            account_label: None,
        })
    }
}
