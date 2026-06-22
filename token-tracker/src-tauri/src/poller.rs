use std::time::Duration;
use sqlx::Row;
use tauri::{AppHandle, Emitter};
use crate::{
    db::Db,
    keychain,
    providers::{
        claude_web::ClaudeWebProvider, claude_code::ClaudeCodeProvider,
        openai::OpenAiProvider, openrouter::OpenRouterProvider,
        chatgpt_web::ChatGptWebProvider, Provider,
    },
    commands::usage::insert_snapshot,
};

pub fn start(app: AppHandle, db: Db) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(300)).await;
            poll_all(&app, &db).await;
        }
    });
}

async fn poll_all(app: &AppHandle, db: &Db) {
    let rows = match sqlx::query("SELECT id FROM providers WHERE enabled = 1")
        .fetch_all(db)
        .await
    {
        Ok(r) => r,
        Err(_) => return,
    };

    for row in rows {
        let id: String = row.get("id");
        do_sync(app, db, &id).await;
    }
}

async fn do_sync(app: &AppHandle, db: &Db, provider_id: &str) {
    let impl_: Box<dyn Provider> = match provider_id {
        "claude_web" => Box::new(ClaudeWebProvider),
        "claude_code" => Box::new(ClaudeCodeProvider),
        "openai" => Box::new(OpenAiProvider),
        "openrouter" => Box::new(OpenRouterProvider),
        "chatgpt_web" => Box::new(ChatGptWebProvider),
        _ => return,
    };

    let secret = if provider_id == "claude_code" {
        String::new()
    } else {
        match keychain::get_secret(provider_id) {
            Ok(Some(s)) => s,
            _ => return,
        }
    };

    match impl_.fetch(&secret).await {
        Ok(snap) => {
            if insert_snapshot(db, &snap).await.is_ok() {
                let _ = app.emit("usage_updated", provider_id);
                crate::refresh_tray(app, db).await;
            }
        }
        Err(e) if e.to_string() == "session_expired" => {
            let _ = app.emit("session_expired", provider_id);
        }
        Err(e) => {
            let _ = app.emit("provider_error", (provider_id, e.to_string()));
        }
    }
}
