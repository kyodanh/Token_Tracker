use anyhow::{anyhow, Result};
use async_trait::async_trait;
use serde::Deserialize;
use crate::models::NewSnapshot;
use super::Provider;

pub struct ChatGptWebProvider;

#[derive(Deserialize, Debug, Default)]
struct AccountCheck {
    #[serde(default)]
    account_plan: Option<AccountPlan>,
}

#[derive(Deserialize, Debug)]
struct AccountPlan {
    #[serde(default)]
    is_paid_subscription_active: bool,
}

#[async_trait]
impl Provider for ChatGptWebProvider {
    fn id(&self) -> &str {
        "chatgpt_web"
    }

    async fn fetch(&self, secret: &str) -> Result<NewSnapshot> {
        let client = reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .build()?;

        let resp = client
            .get("https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27")
            .header(
                "Cookie",
                format!("__Secure-next-auth.session-token={secret}"),
            )
            .header("Accept", "application/json")
            .send()
            .await?;

        if resp.status() == 401 || resp.status() == 403 {
            return Err(anyhow!("session_expired"));
        }

        let raw = resp.text().await?;

        Ok(NewSnapshot {
            provider_id: "chatgpt_web".into(),
            snapshot_type: "session".into(),
            tokens_used: None,
            tokens_limit: None,
            cost_usd: None,
            raw_json: Some(raw),
        })
    }
}
