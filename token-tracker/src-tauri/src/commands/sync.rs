use sqlx::Row;
use tauri::{AppHandle, Emitter, State};
use crate::{
    db::Db,
    keychain,
    providers::{
        claude_web::ClaudeWebProvider,
        claude_code::ClaudeCodeProvider,
        openai::OpenAiProvider,
        openrouter::OpenRouterProvider,
        chatgpt_web::ChatGptWebProvider,
        Provider,
    },
    commands::usage::insert_snapshot,
};

pub fn provider_impl(id: &str) -> Option<Box<dyn Provider>> {
    if id == "claude_web" {
        return Some(Box::new(ClaudeWebProvider::primary()));
    }
    if id.starts_with("claude_web_") {
        return Some(Box::new(ClaudeWebProvider::new(id)));
    }
    match id {
        "openai" => Some(Box::new(OpenAiProvider)),
        "openrouter" => Some(Box::new(OpenRouterProvider)),
        "chatgpt_web" => Some(Box::new(ChatGptWebProvider)),
        _ => None,
    }
}

async fn get_config_dir(db: &Db, provider_id: &str) -> std::path::PathBuf {
    let key = format!("{}_config_path", provider_id);
    let path: Option<String> = sqlx::query_scalar("SELECT value FROM settings WHERE key = ?")
        .bind(&key)
        .fetch_optional(db)
        .await
        .ok()
        .flatten();
    match path {
        Some(p) if !p.is_empty() => std::path::PathBuf::from(p),
        _ => dirs::home_dir().unwrap_or_default().join(".claude"),
    }
}

#[tauri::command]
pub async fn sync_provider(
    provider_id: String,
    app: AppHandle,
    db: State<'_, Db>,
) -> Result<(), String> {
    let impl_: Box<dyn Provider> = if provider_id == "claude_code" {
        Box::new(ClaudeCodeProvider::primary())
    } else if provider_id.starts_with("claude_code_") {
        let config_dir = get_config_dir(db.inner(), &provider_id).await;
        Box::new(ClaudeCodeProvider::with_config(provider_id.clone(), config_dir))
    } else {
        provider_impl(&provider_id).ok_or_else(|| format!("Unknown provider: {provider_id}"))?
    };

    let secret = if provider_id.starts_with("claude_code") {
        String::new()
    } else {
        keychain::get_secret(&provider_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("No credentials for {provider_id}"))?
    };

    match impl_.fetch(&secret).await {
        Ok(snap) => {
            insert_snapshot(db.inner(), &snap)
                .await
                .map_err(|e| e.to_string())?;
            let _ = app.emit("usage_updated", &provider_id);
            Ok(())
        }
        Err(e) if e.to_string() == "session_expired" => {
            let _ = app.emit("session_expired", &provider_id);
            Err(format!("session_expired:{provider_id}"))
        }
        Err(e) => {
            let _ = app.emit("provider_error", (&provider_id, e.to_string()));
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn sync_all_providers(app: AppHandle, db: State<'_, Db>) -> Result<(), String> {
    let rows = sqlx::query("SELECT id FROM providers WHERE enabled = 1")
        .fetch_all(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    for row in rows {
        let id: String = row.get("id");
        let _ = sync_provider(id, app.clone(), db.clone()).await;
    }
    Ok(())
}
