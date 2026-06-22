use sqlx::Row;
use tauri::State;
use std::collections::HashMap;
use crate::db::Db;

#[tauri::command]
pub async fn get_settings(db: State<'_, Db>) -> Result<HashMap<String, String>, String> {
    let rows = sqlx::query("SELECT key, value FROM settings")
        .fetch_all(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|r| (r.get("key"), r.get("value"))).collect())
}

#[tauri::command]
pub async fn set_setting(key: String, value: String, db: State<'_, Db>) -> Result<(), String> {
    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .bind(&key)
        .bind(&value)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
