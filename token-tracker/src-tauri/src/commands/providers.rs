use sqlx::Row;
use tauri::State;
use serde::Serialize;
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

#[tauri::command]
pub async fn add_claude_code_account(
    label: String,
    config_path: String,
    db: State<'_, Db>,
) -> Result<String, String> {
    let existing_ids: Vec<String> = sqlx::query_scalar(
        "SELECT id FROM providers WHERE id LIKE 'claude_code_%'"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    let mut n = 2u32;
    loop {
        let candidate = format!("claude_code_{}", n);
        if !existing_ids.contains(&candidate) { break; }
        n += 1;
    }
    let new_id = format!("claude_code_{}", n);

    sqlx::query(
        "INSERT INTO providers (id, name, enabled, keychain_key) VALUES (?, ?, 1, NULL)"
    )
    .bind(&new_id)
    .bind(&label)
    .execute(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .bind(format!("{}_config_path", new_id))
        .bind(&config_path)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .bind(format!("{}_account", new_id))
        .bind(&label)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(new_id)
}

#[tauri::command]
pub async fn remove_claude_code_account(
    id: String,
    db: State<'_, Db>,
) -> Result<(), String> {
    if !id.starts_with("claude_code_") {
        return Err("Can only remove additional claude_code accounts".into());
    }

    sqlx::query("DELETE FROM providers WHERE id = ?")
        .bind(&id)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    for suffix in &["_config_path", "_account", "_plan"] {
        let _ = sqlx::query("DELETE FROM settings WHERE key = ?")
            .bind(format!("{}{}", id, suffix))
            .execute(db.inner())
            .await;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_claude_code_config_path(
    id: String,
    db: State<'_, Db>,
) -> Result<Option<String>, String> {
    let key = format!("{}_config_path", id);
    let path: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = ?")
        .bind(&key)
        .fetch_optional(db.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(path)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeAuthStatus {
    pub logged_in: bool,
    pub email: Option<String>,
    pub org_name: Option<String>,
    pub subscription_type: Option<String>,
    pub config_path: String,
}

/// Spawns `claude auth login` with CLAUDE_CONFIG_DIR set to the given path.
/// Returns the config_path so the frontend knows where to poll status.
#[tauri::command]
pub async fn start_claude_login(label: String) -> Result<String, String> {
    let home = dirs::home_dir().ok_or("no home dir")?;
    let slug = label
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .to_string();
    let config_path = home.join(format!(".claude-{}", slug));
    let config_path_str = config_path.to_string_lossy().to_string();

    std::fs::create_dir_all(&config_path).map_err(|e| e.to_string())?;

    let claude_bin = which_claude()?;

    std::process::Command::new(&claude_bin)
        .args(["auth", "login"])
        .env("CLAUDE_CONFIG_DIR", &config_path_str)
        .spawn()
        .map_err(|e| format!("Failed to launch claude: {e}"))?;

    Ok(config_path_str)
}

/// Checks `claude auth status` for a given config dir. Returns account info if logged in.
#[tauri::command]
pub async fn check_claude_login_status(config_path: String) -> Result<ClaudeAuthStatus, String> {
    let claude_bin = which_claude()?;

    let output = std::process::Command::new(&claude_bin)
        .args(["auth", "status", "--json"])
        .env("CLAUDE_CONFIG_DIR", &config_path)
        .output()
        .or_else(|_| {
            // fallback: no --json flag on older versions
            std::process::Command::new(&claude_bin)
                .args(["auth", "status"])
                .env("CLAUDE_CONFIG_DIR", &config_path)
                .output()
        })
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Try JSON parse first
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
        let logged_in = json.get("loggedIn").and_then(|v| v.as_bool()).unwrap_or(false);
        return Ok(ClaudeAuthStatus {
            logged_in,
            email: json.get("email").and_then(|v| v.as_str()).map(String::from),
            org_name: json.get("orgName").and_then(|v| v.as_str()).map(String::from),
            subscription_type: json.get("subscriptionType").and_then(|v| v.as_str()).map(String::from),
            config_path,
        });
    }

    // Fallback: parse text output
    let logged_in = stdout.contains("Logged in") || stdout.contains("loggedIn: true");
    Ok(ClaudeAuthStatus {
        logged_in,
        email: None,
        org_name: None,
        subscription_type: None,
        config_path,
    })
}

/// Scans home dir for ~/.claude-*/ directories that contain a projects/ subdir (potential accounts).
#[tauri::command]
pub async fn scan_claude_code_dirs() -> Result<Vec<ClaudeAuthStatus>, String> {
    let home = dirs::home_dir().ok_or("no home dir")?;
    let claude_bin = which_claude().ok();

    let mut found = Vec::new();

    let entries = std::fs::read_dir(&home).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() { continue; }
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if !name.starts_with(".claude-") { continue; }
        // Accept dirs that have projects/, settings.json, or .claude.json (fresh login)
        if !path.join("projects").exists()
            && !path.join("settings.json").exists()
            && !path.join(".claude.json").exists()
        { continue; }

        let config_path_str = path.to_string_lossy().to_string();

        let status = if let Some(ref bin) = claude_bin {
            let out = std::process::Command::new(bin)
                .args(["auth", "status"])
                .env("CLAUDE_CONFIG_DIR", &config_path_str)
                .output()
                .ok();

            if let Some(o) = out {
                let stdout = String::from_utf8_lossy(&o.stdout);
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                    let logged_in = json.get("loggedIn").and_then(|v| v.as_bool()).unwrap_or(false);
                    ClaudeAuthStatus {
                        logged_in,
                        email: json.get("email").and_then(|v| v.as_str()).map(String::from),
                        org_name: json.get("orgName").and_then(|v| v.as_str()).map(String::from),
                        subscription_type: json.get("subscriptionType").and_then(|v| v.as_str()).map(String::from),
                        config_path: config_path_str,
                    }
                } else {
                    ClaudeAuthStatus { logged_in: false, email: None, org_name: None, subscription_type: None, config_path: config_path_str }
                }
            } else {
                ClaudeAuthStatus { logged_in: false, email: None, org_name: None, subscription_type: None, config_path: config_path_str }
            }
        } else {
            ClaudeAuthStatus { logged_in: false, email: None, org_name: None, subscription_type: None, config_path: config_path_str }
        };

        found.push(status);
    }

    Ok(found)
}

#[tauri::command]
pub async fn add_claude_web_account(
    label: String,
    session_key: String,
    db: State<'_, Db>,
) -> Result<String, String> {
    let existing_ids: Vec<String> = sqlx::query_scalar(
        "SELECT id FROM providers WHERE id LIKE 'claude_web_%'"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    let mut n = 2u32;
    loop {
        let candidate = format!("claude_web_{}", n);
        if !existing_ids.contains(&candidate) { break; }
        n += 1;
    }
    let new_id = format!("claude_web_{}", n);

    sqlx::query(
        "INSERT INTO providers (id, name, enabled, keychain_key) VALUES (?, ?, 1, ?)"
    )
    .bind(&new_id)
    .bind(&label)
    .bind(&new_id)
    .execute(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .bind(format!("{}_account", new_id))
        .bind(&label)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    crate::keychain::set_secret(&new_id, &session_key)
        .map_err(|e| e.to_string())?;

    Ok(new_id)
}

#[tauri::command]
pub async fn remove_claude_web_account(
    id: String,
    db: State<'_, Db>,
) -> Result<(), String> {
    if !id.starts_with("claude_web_") {
        return Err("Can only remove additional claude_web accounts".into());
    }

    sqlx::query("DELETE FROM providers WHERE id = ?")
        .bind(&id)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    let _ = sqlx::query("DELETE FROM settings WHERE key = ?")
        .bind(format!("{}_account", &id))
        .execute(db.inner())
        .await;

    let _ = crate::keychain::delete_secret(&id);

    Ok(())
}

fn which_claude() -> Result<String, String> {
    // Try common locations
    for path in &[
        "/Users/dannymacmini/.local/bin/claude",
        "/usr/local/bin/claude",
        "/opt/homebrew/bin/claude",
    ] {
        if std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }
    // Fallback: let the shell find it
    let out = std::process::Command::new("sh")
        .args(["-c", "which claude"])
        .output()
        .map_err(|e| e.to_string())?;
    let p = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if p.is_empty() { Err("claude binary not found".into()) } else { Ok(p) }
}
