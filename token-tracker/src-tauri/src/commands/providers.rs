use sqlx::Row;
use tauri::State;
use crate::{db::Db, models::Provider};

/// Reads ~/.claude/settings.json and extracts the Claude subscription plan.
/// Returns one of: "free", "pro", "team", "max_5x", "max_20x", "enterprise", or "unknown".
#[tauri::command]
pub fn get_claude_plan() -> String {
    let settings_path = match dirs::home_dir() {
        Some(h) => h.join(".claude").join("settings.json"),
        None => return "unknown".to_string(),
    };

    let content = match std::fs::read_to_string(&settings_path) {
        Ok(c) => c,
        Err(_) => return "unknown".to_string(),
    };

    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return "unknown".to_string(),
    };

    // Try env.OTEL_RESOURCE_ATTRIBUTES for claude.subscription.type
    if let Some(attrs) = json
        .get("env")
        .and_then(|e| e.get("OTEL_RESOURCE_ATTRIBUTES"))
        .and_then(|v| v.as_str())
    {
        for part in attrs.split(',') {
            let part = part.trim();
            if let Some(val) = part.strip_prefix("claude.subscription.type=") {
                return normalize_plan(val);
            }
        }
    }

    "unknown".to_string()
}

fn normalize_plan(raw: &str) -> String {
    match raw.to_lowercase().as_str() {
        "free" => "free".to_string(),
        "pro" => "pro".to_string(),
        "team" => "team".to_string(),
        "max" | "max_5x" | "max5x" | "max_5" => "max_5x".to_string(),
        "max_20x" | "max20x" | "max_20" => "max_20x".to_string(),
        "enterprise" => "enterprise".to_string(),
        other => other.to_string(),
    }
}

#[tauri::command]
pub async fn get_all_providers(db: State<'_, Db>) -> Result<Vec<Provider>, String> {
    let rows = sqlx::query(
        "SELECT p.id, p.name, p.enabled, p.keychain_key, p.last_synced_at, p.created_at,
                s.value as account_label
         FROM providers p
         LEFT JOIN settings s ON s.key = p.id || '_account'
         ORDER BY p.created_at"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows
        .iter()
        .map(|r| Provider {
            id: r.get("id"),
            name: r.get("name"),
            enabled: r.get::<i32, _>("enabled") != 0,
            keychain_key: r.get("keychain_key"),
            last_synced_at: r.get("last_synced_at"),
            created_at: r.get::<Option<i64>, _>("created_at").unwrap_or(0),
            account_label: r.get("account_label"),
        })
        .collect())
}

#[tauri::command]
pub async fn update_provider(
    id: String,
    enabled: bool,
    db: State<'_, Db>,
) -> Result<(), String> {
    sqlx::query("UPDATE providers SET enabled = ? WHERE id = ?")
        .bind(enabled as i32)
        .bind(&id)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
