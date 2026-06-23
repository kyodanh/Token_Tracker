use anyhow::Result;
use async_trait::async_trait;
use serde::Deserialize;
use chrono::{Local, Duration};
use crate::{models::NewSnapshot, pricing};
use super::Provider;

pub struct ClaudeCodeProvider;

#[derive(Deserialize)]
struct LogEntry {
    #[serde(rename = "type")]
    entry_type: Option<String>,
    timestamp: Option<String>,
    message: Option<MessageField>,
}

#[derive(Deserialize)]
struct MessageField {
    model: Option<String>,
    usage: Option<UsageField>,
}

#[derive(Deserialize)]
struct UsageField {
    #[serde(default)]
    input_tokens: i64,
    #[serde(default)]
    output_tokens: i64,
    #[serde(default)]
    cache_creation_input_tokens: i64,
    #[serde(default)]
    cache_read_input_tokens: i64,
}

#[async_trait]
impl Provider for ClaudeCodeProvider {
    fn id(&self) -> &str {
        "claude_code"
    }

    async fn fetch(&self, _secret: &str) -> Result<NewSnapshot> {
        let today = Local::now().date_naive().to_string();
        let (total_tokens, total_cost) = parse_logs_for_date(&today)?;

        Ok(NewSnapshot {
            provider_id: "claude_code".into(),
            snapshot_type: "daily".into(),
            tokens_used: Some(total_tokens),
            tokens_limit: None,
            cost_usd: Some(total_cost),
            raw_json: None,
            account_label: read_account_email(),
        })
    }
}

/// Returns (date, total_tokens, cost_usd) for each of the last `days` days that have usage.
pub fn backfill_history(days: usize) -> Result<Vec<(String, i64, f64)>> {
    let today = Local::now().date_naive();
    let mut out = Vec::new();
    for i in 0..days as i64 {
        let d = today - Duration::days(i);
        let date_str = d.to_string();
        let (tokens, cost) = parse_logs_for_date(&date_str)?;
        if tokens > 0 || cost > 0.0 {
            out.push((date_str, tokens, cost));
        }
    }
    Ok(out)
}

/// Reads ~/.claude/projects/**/*.jsonl and aggregates token usage + cost for the given date.
pub fn parse_logs_for_date(date: &str) -> Result<(i64, f64)> {
    let projects_dir = dirs::home_dir()
        .ok_or_else(|| anyhow::anyhow!("no home dir"))?
        .join(".claude")
        .join("projects");

    if !projects_dir.exists() {
        return Ok((0, 0.0));
    }

    let mut total_tokens = 0i64;
    let mut total_cost = 0.0f64;

    let mut jsonl_files: Vec<std::path::PathBuf> = Vec::new();
    collect_jsonl_files(&projects_dir, &mut jsonl_files);

    for path in &jsonl_files {
        let content = std::fs::read_to_string(path).unwrap_or_default();
        for line in content.lines() {
            let Ok(entry): Result<LogEntry, _> = serde_json::from_str(line) else { continue };
            if entry.entry_type.as_deref() != Some("assistant") { continue; }
            let ts = entry.timestamp.as_deref().unwrap_or("");
            if !ts.starts_with(date) { continue; }
            let Some(msg) = &entry.message else { continue };
            let Some(usage) = &msg.usage else { continue };
            let model = msg.model.as_deref().unwrap_or("claude-sonnet");
            let cost = pricing::calculate_cost_with_cache(
                model,
                usage.input_tokens,
                usage.output_tokens,
                usage.cache_creation_input_tokens,
                usage.cache_read_input_tokens,
            );
            total_cost += cost;
            total_tokens += usage.input_tokens + usage.output_tokens
                + usage.cache_creation_input_tokens + usage.cache_read_input_tokens;
        }
    }

    Ok((total_tokens, total_cost))
}

/// Reads the user email from ~/.claude/settings.json OTEL_RESOURCE_ATTRIBUTES.
fn read_account_email() -> Option<String> {
    let path = dirs::home_dir()?.join(".claude").join("settings.json");
    let content = std::fs::read_to_string(path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let attrs = json.get("env")?.get("OTEL_RESOURCE_ATTRIBUTES")?.as_str()?;
    for part in attrs.split(',') {
        if let Some(email) = part.trim().strip_prefix("user.email=") {
            if !email.is_empty() {
                return Some(email.to_string());
            }
        }
    }
    None
}

fn collect_jsonl_files(dir: &std::path::Path, out: &mut Vec<std::path::PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_jsonl_files(&path, out);
        } else if path.extension().and_then(|e| e.to_str()) == Some("jsonl") {
            out.push(path);
        }
    }
}
