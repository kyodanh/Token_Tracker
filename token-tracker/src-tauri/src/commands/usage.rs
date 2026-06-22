use sqlx::Row;
use tauri::State;
use chrono::Local;
use crate::{
    db::Db,
    models::{DailySpend, Provider, ProviderSummary, Subscription, TodaySummary, UsageSnapshot},
};

fn row_to_snapshot(r: &sqlx::sqlite::SqliteRow) -> UsageSnapshot {
    UsageSnapshot {
        id: r.get("id"),
        provider_id: r.get("provider_id"),
        snapshot_type: r.get("snapshot_type"),
        tokens_used: r.get("tokens_used"),
        tokens_limit: r.get("tokens_limit"),
        cost_usd: r.get("cost_usd"),
        raw_json: r.get("raw_json"),
        captured_at: r.get::<Option<i64>, _>("captured_at").unwrap_or(0),
    }
}

#[tauri::command]
pub async fn get_today_summary(db: State<'_, Db>) -> Result<TodaySummary, String> {
    let providers = sqlx::query(
        "SELECT id, name, enabled, keychain_key, last_synced_at, created_at FROM providers WHERE enabled = 1"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    let mut summaries = Vec::new();
    let mut total_cost = 0.0f64;

    for p in &providers {
        let provider_id: String = p.get("id");
        let snapshot = sqlx::query(
            "SELECT id, provider_id, snapshot_type, tokens_used, tokens_limit, cost_usd, raw_json, captured_at FROM usage_snapshots WHERE provider_id = ? ORDER BY captured_at DESC LIMIT 1"
        )
        .bind(&provider_id)
        .fetch_optional(db.inner())
        .await
        .map_err(|e| e.to_string())?
        .map(|r| row_to_snapshot(&r));

        let usage_percent = snapshot.as_ref().and_then(|s| {
            match (s.tokens_used, s.tokens_limit) {
                (Some(used), Some(limit)) if limit > 0 => Some((used as f64 / limit as f64) * 100.0),
                (None, Some(limit)) if limit > 0 => {
                    s.cost_usd.map(|cost| (cost / limit as f64) * 100.0)
                }
                _ => None,
            }
        });

        // Extract weekly utilization from raw_json (claude.ai /usage endpoint)
        let (weekly_usage_percent, weekly_resets_at) = snapshot.as_ref()
            .and_then(|s| s.raw_json.as_ref())
            .and_then(|j| serde_json::from_str::<serde_json::Value>(j).ok())
            .map(|v| {
                let pct = v.get("seven_day")
                    .and_then(|x| x.get("utilization"))
                    .and_then(|x| x.as_f64());
                let resets = v.get("seven_day")
                    .and_then(|x| x.get("resets_at"))
                    .and_then(|x| x.as_str())
                    .map(|s| s.to_string());
                (pct, resets)
            })
            .unwrap_or((None, None));

        total_cost += snapshot.as_ref().and_then(|s| s.cost_usd).unwrap_or(0.0);

        summaries.push(ProviderSummary {
            provider: Provider {
                id: p.get("id"),
                name: p.get("name"),
                enabled: p.get::<i32, _>("enabled") != 0,
                keychain_key: p.get("keychain_key"),
                last_synced_at: p.get("last_synced_at"),
                created_at: p.get::<Option<i64>, _>("created_at").unwrap_or(0),
            },
            snapshot,
            usage_percent,
            weekly_usage_percent,
            weekly_resets_at,
        });
    }

    Ok(TodaySummary { providers: summaries, total_cost_usd: total_cost })
}

#[tauri::command]
pub async fn get_weekly_spend(db: State<'_, Db>) -> Result<Vec<DailySpend>, String> {
    let rows = sqlx::query(
        "SELECT id, provider_id, date, tokens_used, cost_usd FROM daily_spend WHERE date >= date('now', '-6 days') ORDER BY date, provider_id"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows
        .iter()
        .map(|r| DailySpend {
            id: r.get("id"),
            provider_id: r.get("provider_id"),
            date: r.get("date"),
            tokens_used: r.get("tokens_used"),
            cost_usd: r.get("cost_usd"),
        })
        .collect())
}

#[tauri::command]
pub async fn get_latest_snapshot(
    provider_id: String,
    db: State<'_, Db>,
) -> Result<Option<UsageSnapshot>, String> {
    let row = sqlx::query(
        "SELECT id, provider_id, snapshot_type, tokens_used, tokens_limit, cost_usd, raw_json, captured_at FROM usage_snapshots WHERE provider_id = ? ORDER BY captured_at DESC LIMIT 1"
    )
    .bind(&provider_id)
    .fetch_optional(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(row.map(|r| row_to_snapshot(&r)))
}

#[tauri::command]
pub async fn get_subscriptions(db: State<'_, Db>) -> Result<Vec<Subscription>, String> {
    let rows = sqlx::query(
        "SELECT id, provider_id, plan_name, cost_usd, billing_cycle, next_reset_at FROM subscriptions"
    )
    .fetch_all(db.inner())
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows
        .iter()
        .map(|r| Subscription {
            id: r.get("id"),
            provider_id: r.get("provider_id"),
            plan_name: r.get("plan_name"),
            cost_usd: r.get("cost_usd"),
            billing_cycle: r.get("billing_cycle"),
            next_reset_at: r.get("next_reset_at"),
        })
        .collect())
}

#[tauri::command]
pub async fn upsert_subscription(
    sub: Subscription,
    db: State<'_, Db>,
) -> Result<(), String> {
    sqlx::query(
        "INSERT OR REPLACE INTO subscriptions (id, provider_id, plan_name, cost_usd, billing_cycle, next_reset_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(if sub.id == 0 { None } else { Some(sub.id) })
    .bind(&sub.provider_id)
    .bind(&sub.plan_name)
    .bind(sub.cost_usd)
    .bind(&sub.billing_cycle)
    .bind(sub.next_reset_at)
    .execute(db.inner())
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_subscription(id: i64, db: State<'_, Db>) -> Result<(), String> {
    sqlx::query("DELETE FROM subscriptions WHERE id = ?")
        .bind(id)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn insert_snapshot(db: &Db, snap: &crate::models::NewSnapshot) -> anyhow::Result<()> {
    let today = Local::now().date_naive().to_string();
    sqlx::query(
        "INSERT INTO usage_snapshots (provider_id, snapshot_type, tokens_used, tokens_limit, cost_usd, raw_json) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&snap.provider_id)
    .bind(&snap.snapshot_type)
    .bind(snap.tokens_used)
    .bind(snap.tokens_limit)
    .bind(snap.cost_usd)
    .bind(&snap.raw_json)
    .execute(db)
    .await?;

    if let Some(cost) = snap.cost_usd {
        let tokens = snap.tokens_used.unwrap_or(0);
        sqlx::query(
            "INSERT INTO daily_spend (provider_id, date, tokens_used, cost_usd) VALUES (?, ?, ?, ?) ON CONFLICT(provider_id, date) DO UPDATE SET tokens_used = excluded.tokens_used, cost_usd = excluded.cost_usd"
        )
        .bind(&snap.provider_id)
        .bind(&today)
        .bind(tokens)
        .bind(cost)
        .execute(db)
        .await?;
    }

    sqlx::query("UPDATE providers SET last_synced_at = unixepoch() WHERE id = ?")
        .bind(&snap.provider_id)
        .execute(db)
        .await?;

    Ok(())
}
