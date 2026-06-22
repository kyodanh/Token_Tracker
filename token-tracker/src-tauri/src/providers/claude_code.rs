use anyhow::Result;
use async_trait::async_trait;
use serde::Deserialize;
use chrono::Local;
use crate::{models::NewSnapshot, pricing};
use super::Provider;

pub struct ClaudeCodeProvider;

#[derive(Deserialize, Debug)]
struct LogEntry {
    #[serde(default)]
    model: Option<String>,
    #[serde(default)]
    input_tokens: Option<i64>,
    #[serde(default)]
    output_tokens: Option<i64>,
    #[serde(default)]
    timestamp: Option<String>,
    #[serde(default)]
    usage: Option<UsageField>,
}

#[derive(Deserialize, Debug)]
struct UsageField {
    #[serde(default)]
    input_tokens: Option<i64>,
    #[serde(default)]
    output_tokens: Option<i64>,
}

#[async_trait]
impl Provider for ClaudeCodeProvider {
    fn id(&self) -> &str {
        "claude_code"
    }

    async fn fetch(&self, _secret: &str) -> Result<NewSnapshot> {
        let today = Local::now().date_naive().to_string();
        let (total_input, total_output, total_cost) = parse_today_logs(&today)?;

        Ok(NewSnapshot {
            provider_id: "claude_code".into(),
            snapshot_type: "daily".into(),
            tokens_used: Some(total_input + total_output),
            tokens_limit: None,
            cost_usd: Some(total_cost),
            raw_json: None,
        })
    }
}

pub fn parse_today_logs(today: &str) -> Result<(i64, i64, f64)> {
    let logs_dir = dirs::home_dir()
        .ok_or_else(|| anyhow::anyhow!("no home dir"))?
        .join(".claude")
        .join("logs");

    let mut total_input = 0i64;
    let mut total_output = 0i64;
    let mut total_cost = 0.0f64;

    if !logs_dir.exists() {
        return Ok((0, 0, 0.0));
    }

    for entry in std::fs::read_dir(&logs_dir)?.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("jsonl") {
            continue;
        }
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        for line in content.lines() {
            let Ok(log): Result<LogEntry, _> = serde_json::from_str(line) else {
                continue;
            };
            let is_today = log.timestamp.as_deref()
                .map(|t| t.starts_with(today))
                .unwrap_or(true);
            if !is_today {
                continue;
            }
            let (inp, out) = if let Some(u) = &log.usage {
                (u.input_tokens.unwrap_or(0), u.output_tokens.unwrap_or(0))
            } else {
                (log.input_tokens.unwrap_or(0), log.output_tokens.unwrap_or(0))
            };
            let model = log.model.as_deref().unwrap_or("claude-sonnet");
            total_cost += pricing::calculate_cost(model, inp, out);
            total_input += inp;
            total_output += out;
        }
    }

    Ok((total_input, total_output, total_cost))
}
