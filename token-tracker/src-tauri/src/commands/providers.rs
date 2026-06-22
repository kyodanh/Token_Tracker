use sqlx::Row;
use tauri::State;
use crate::{db::Db, models::Provider};

#[tauri::command]
pub async fn get_all_providers(db: State<'_, Db>) -> Result<Vec<Provider>, String> {
    let rows = sqlx::query(
        "SELECT id, name, enabled, keychain_key, last_synced_at, created_at FROM providers ORDER BY created_at"
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
