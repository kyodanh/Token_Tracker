use anyhow::{anyhow, Result};
use async_trait::async_trait;
use serde::Deserialize;
use crate::models::NewSnapshot;
use super::Provider;

pub struct ClaudeWebProvider;

#[derive(Deserialize, Debug, Default)]
struct OrgEntry {
    uuid: Option<String>,
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    capabilities: serde_json::Value,
}

#[derive(Deserialize, Debug, Default)]
struct AccountInfo {
    email: Option<String>,
    full_name: Option<String>,
    name: Option<String>,
    display_name: Option<String>,
}

#[derive(Deserialize, Debug, Default)]
struct ClaudeUsageResponse {
    #[serde(default)]
    usage_based_billing: Option<UsageBasedBilling>,
}

#[derive(Deserialize, Debug, Default)]
struct UsageBasedBilling {
    #[serde(default)]
    monthly_cost_cents: Option<i64>,
    #[serde(default)]
    monthly_limit_cents: Option<i64>,
}

#[derive(Deserialize, Debug, Default)]
struct RateLimitInfo {
    #[serde(default)]
    resets_at: Option<String>,
    // various rate limit fields — pick up whatever the API returns
    #[serde(flatten)]
    extra: serde_json::Value,
}

fn extract_usage_from_capabilities(caps: &serde_json::Value) -> (Option<i64>, Option<i64>) {
    // Try to pull tokens_used / tokens_limit from capabilities blob
    if let Some(obj) = caps.as_object() {
        for v in obj.values() {
            let used = v.get("tokens_used").and_then(|x| x.as_i64());
            let limit = v.get("tokens_limit")
                .or_else(|| v.get("token_limit"))
                .and_then(|x| x.as_i64());
            if used.is_some() || limit.is_some() {
                return (used, limit);
            }
            let used2 = v.get("message_count").and_then(|x| x.as_i64());
            let limit2 = v.get("message_limit").and_then(|x| x.as_i64());
            if used2.is_some() || limit2.is_some() {
                return (used2, limit2);
            }
        }
    }
    (None, None)
}

#[async_trait]
impl Provider for ClaudeWebProvider {
    fn id(&self) -> &str {
        "claude_web"
    }

    async fn fetch(&self, secret: &str) -> Result<NewSnapshot> {
        // Use Safari UA to match macOS native TLS fingerprint (SecureTransport)
        let client = reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15")
            .build()?;

        let cookie = format!("sessionKey={secret}");

        let headers_common = {
            let mut h = reqwest::header::HeaderMap::new();
            h.insert("Cookie", cookie.parse().unwrap());
            h.insert("Accept", "application/json, text/plain, */*".parse().unwrap());
            h.insert("Accept-Language", "en-US,en;q=0.9".parse().unwrap());
            h.insert("Referer", "https://claude.ai/".parse().unwrap());
            h.insert("Origin", "https://claude.ai".parse().unwrap());
            h.insert("anthropic-client-platform", "web_claude_ai".parse().unwrap());
            h
        };

        // 1. Fetch organizations
        let org_resp = client
            .get("https://claude.ai/api/organizations")
            .headers(headers_common.clone())
            .send()
            .await?;

        let status = org_resp.status();
        if status == 401 || status == 403 {
            return Err(anyhow!("session_expired"));
        }
        if !status.is_success() {
            return Err(anyhow!("HTTP {status} from claude.ai/api/organizations"));
        }

        let raw = org_resp.text().await?;
        eprintln!("[claude_web] /api/organizations → OK, {} chars", raw.len());
        let orgs: Vec<OrgEntry> = serde_json::from_str(&raw).unwrap_or_default();
        let org_id = orgs.first().and_then(|o| o.uuid.clone());

        // Try to extract usage from capabilities in org data
        let cap_usage = orgs.first().map(|o| extract_usage_from_capabilities(&o.capabilities));
        let (cap_tokens_used, cap_tokens_limit) = cap_usage.unwrap_or((None, None));

        // 2. Fetch usage-based billing
        let (cost_usd, billing_tokens_limit) = {
            let r = client
                .get("https://claude.ai/api/usage_based_billing")
                .headers(headers_common.clone())
                .send()
                .await;
            match r {
                Ok(r) if r.status().is_success() => {
                    let text = r.text().await.unwrap_or_default();
                    if let Ok(parsed) = serde_json::from_str::<ClaudeUsageResponse>(&text) {
                        let cost = parsed.usage_based_billing.as_ref()
                            .and_then(|u| u.monthly_cost_cents)
                            .map(|c| c as f64 / 100.0);
                        let limit = parsed.usage_based_billing.as_ref()
                            .and_then(|u| u.monthly_limit_cents)
                            .map(|c| c as i64 / 100);
                        (cost, limit)
                    } else {
                        (None, None)
                    }
                }
                _ => (None, None),
            }
        };

        // 3. Fetch /usage endpoint (five_hour + seven_day utilization)
        let (rate_tokens_used, rate_tokens_limit, usage_json) = if let Some(ref oid) = org_id {
            let url = format!("https://claude.ai/api/organizations/{oid}/usage");
            match client.get(&url).headers(headers_common.clone()).send().await {
                Ok(resp) if resp.status().is_success() => {
                    let text = resp.text().await.unwrap_or_default();
                    let v: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();
                    let five_hour_util = v.get("five_hour")
                        .and_then(|x| x.get("utilization"))
                        .and_then(|x| x.as_f64());
                    if let Some(util) = five_hour_util {
                        (Some(util.round() as i64), Some(100_i64), Some(text))
                    } else {
                        (None, None, Some(text))
                    }
                }
                _ => (None, None, None),
            }
        } else {
            (None, None, None)
        };

        // 4. Try /api/account_details or /api/me
        let (acct_tokens_used, acct_tokens_limit) = {
            let url = if let Some(ref oid) = org_id {
                format!("https://claude.ai/api/organizations/{oid}/account_details")
            } else {
                "https://claude.ai/api/account_details".to_string()
            };
            let r = client.get(&url).headers(headers_common.clone()).send().await;
            match r {
                Ok(r) if r.status().is_success() => {
                    let text = r.text().await.unwrap_or_default();
                    let v: serde_json::Value = serde_json::from_str(&text).unwrap_or_default();
                    let used = v.get("tokens_used")
                        .or_else(|| v.get("message_count"))
                        .and_then(|x| x.as_i64());
                    let limit = v.get("tokens_limit")
                        .or_else(|| v.get("message_limit"))
                        .and_then(|x| x.as_i64());
                    (used, limit)
                }
                _ => (None, None),
            }
        };

        // 5. Fetch account email from /api/me
        let account_label = {
            let r = client
                .get("https://claude.ai/api/me")
                .headers(headers_common.clone())
                .send()
                .await;
            match r {
                Ok(resp) if resp.status().is_success() => {
                    let text = resp.text().await.unwrap_or_default();
                    if let Ok(info) = serde_json::from_str::<AccountInfo>(&text) {
                        info.email
                            .or(info.full_name)
                            .or(info.display_name)
                            .or(info.name)
                    } else {
                        None
                    }
                }
                _ => orgs.first().and_then(|o| o.name.clone()),
            }
        };

        let tokens_used = rate_tokens_used.or(cap_tokens_used).or(acct_tokens_used);
        let tokens_limit = rate_tokens_limit.or(cap_tokens_limit).or(acct_tokens_limit).or(billing_tokens_limit);

        Ok(NewSnapshot {
            provider_id: "claude_web".into(),
            snapshot_type: "session".into(),
            tokens_used,
            tokens_limit,
            cost_usd,
            raw_json: usage_json.or(Some(raw)),
            account_label,
        })
    }
}
