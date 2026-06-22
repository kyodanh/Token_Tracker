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
    match id {
        "claude_web" => Some(Box::new(ClaudeWebProvider)),
        "claude_code" => Some(Box::new(ClaudeCodeProvider)),
        "openai" => Some(Box::new(OpenAiProvider)),
        "openrouter" => Some(Box::new(OpenRouterProvider)),
        "chatgpt_web" => Some(Box::new(ChatGptWebProvider)),
        _ => None,
    }
}

#[tauri::command]
pub async fn sync_provider(
    provider_id: String,
    app: AppHandle,
    db: State<'_, Db>,
) -> Result<(), String> {
    let impl_ = provider_impl(&provider_id)
        .ok_or_else(|| format!("Unknown provider: {provider_id}"))?;

    let secret = if provider_id == "claude_code" {
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
