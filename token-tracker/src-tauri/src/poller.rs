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

const REMINDER_THRESHOLDS: &[i64] = &[7, 3, 1];

pub fn start(app: AppHandle, db: Db) {
    // Fast loop: claude_code reads local files, safe to poll every 60 seconds
    let app2 = app.clone();
    let db2 = db.clone();
    tauri::async_runtime::spawn(async move {
        backfill_claude_code(&db2).await;
        loop {
            do_sync(&app2, &db2, "claude_code").await;
            tokio::time::sleep(Duration::from_secs(60)).await;
        }
    });

    // Slow loop: network providers every 5 minutes
    let app3 = app.clone();
    let db3 = db.clone();
    tauri::async_runtime::spawn(async move {
        poll_network(&app3, &db3).await;
        loop {
            tokio::time::sleep(Duration::from_secs(300)).await;
            poll_network(&app3, &db3).await;
        }
    });

    // Reminder loop: check subscription renewals every hour
    tauri::async_runtime::spawn(async move {
        check_renewal_reminders(&db).await;
        loop {
            tokio::time::sleep(Duration::from_secs(3600)).await;
            check_renewal_reminders(&db).await;
        }
    });
}

async fn backfill_claude_code(db: &Db) {
    use crate::providers::claude_code::backfill_history;
    let Ok(history) = backfill_history(7) else { return };
    for (date, tokens, cost) in history {
        let _ = sqlx::query(
            "INSERT INTO daily_spend (provider_id, date, tokens_used, cost_usd) VALUES (?, ?, ?, ?)
             ON CONFLICT(provider_id, date) DO UPDATE SET
               tokens_used = MAX(excluded.tokens_used, daily_spend.tokens_used),
               cost_usd    = MAX(excluded.cost_usd,    daily_spend.cost_usd)"
        )
        .bind("claude_code")
        .bind(&date)
        .bind(tokens)
        .bind(cost)
        .execute(db)
        .await;
    }
}

/// Sync all non-claude_code providers (network calls, run every 5 min).
async fn poll_network(app: &AppHandle, db: &Db) {
    let rows = match sqlx::query("SELECT id FROM providers WHERE enabled = 1 AND id != 'claude_code'")
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

async fn check_renewal_reminders(db: &Db) {
    let now_unix = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let rows = match sqlx::query(
        "SELECT s.id, s.provider_id, s.plan_name, s.cost_usd, s.billing_cycle, s.next_reset_at
         FROM subscriptions s
         WHERE s.next_reset_at IS NOT NULL AND s.next_reset_at > ?"
    )
    .bind(now_unix)
    .fetch_all(db)
    .await {
        Ok(r) => r,
        Err(_) => return,
    };

    for row in rows {
        let sub_id: i64 = row.get("id");
        let provider_id: String = row.get("provider_id");
        let plan_name: Option<String> = row.get("plan_name");
        let cost_usd: Option<f64> = row.get("cost_usd");
        let next_reset_at: i64 = row.get("next_reset_at");

        let diff_secs = next_reset_at - now_unix;
        let days_remaining = diff_secs / 86400;

        for &threshold in REMINDER_THRESHOLDS {
            // Trigger on the exact threshold day (within a ±12h window)
            if days_remaining != threshold {
                continue;
            }

            let sent_key = format!("reminder_sent_{}_{}_{}d", sub_id, next_reset_at, threshold);
            let already_sent: bool = sqlx::query_scalar(
                "SELECT COUNT(*) FROM settings WHERE key = ?"
            )
            .bind(&sent_key)
            .fetch_one(db)
            .await
            .map(|n: i64| n > 0)
            .unwrap_or(false);

            if already_sent {
                continue;
            }

            // Build notification content
            let label = plan_name.clone().unwrap_or_else(|| provider_id.clone());
            let cost_str = cost_usd.map(|c| format!("${:.2}/mo", c)).unwrap_or_default();
            let renewal_date = chrono::DateTime::from_timestamp(next_reset_at, 0)
                .map(|dt: chrono::DateTime<chrono::Utc>| dt.format("%d/%m/%Y").to_string())
                .unwrap_or_default();

            let day_label = if threshold == 1 { "1 ngày".to_string() } else { format!("{} ngày", threshold) };
            let body = format!(
                "{}{} gia hạn sau {} ({})",
                label,
                if cost_str.is_empty() { String::new() } else { format!(" {}", cost_str) },
                day_label,
                renewal_date
            );

            // Send system notification (platform-specific)
            #[cfg(target_os = "macos")]
            {
                let script = format!(
                    "display notification {:?} with title \"T4B \u{2014} Nh\u{1eafc} gia h\u{1ea1}n\"",
                    body
                );
                let _ = std::process::Command::new("osascript")
                    .args(["-e", &script])
                    .spawn();
            }
            #[cfg(target_os = "windows")]
            {
                let ps = format!(
                    "Add-Type -A System.Windows.Forms; \
                     $n=New-Object System.Windows.Forms.NotifyIcon; \
                     $n.Icon=[System.Drawing.SystemIcons]::Information; \
                     $n.BalloonTipTitle='TokenTracker'; \
                     $n.BalloonTipText='{}'; \
                     $n.Visible=$true; \
                     $n.ShowBalloonTip(5000); \
                     Start-Sleep -Seconds 2; \
                     $n.Dispose()",
                    body.replace('\'', "''")
                );
                let _ = std::process::Command::new("powershell")
                    .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden",
                           "-Command", &ps])
                    .spawn();
            }

            // Mark as sent
            let _ = sqlx::query(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, '1')"
            )
            .bind(&sent_key)
            .execute(db)
            .await;
        }
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
            // Persist account label to settings table before inserting snapshot
            if let Some(ref label) = snap.account_label {
                let key = format!("{}_account", provider_id);
                let _ = sqlx::query(
                    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
                )
                .bind(&key)
                .bind(label)
                .execute(db)
                .await;
            }
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
