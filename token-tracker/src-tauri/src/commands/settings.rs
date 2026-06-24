use sqlx::Row;
use tauri::State;
use std::collections::HashMap;
use crate::db::Db;
use serde::Serialize;

#[derive(Serialize)]
pub struct ComponentStatus {
    pub name: String,
    pub status: String,
}

#[derive(Serialize)]
pub struct IncidentSummary {
    pub name: String,
    pub status: String,
    pub body: String,
}

#[derive(Serialize)]
pub struct ClaudeStatus {
    pub indicator: String,
    pub description: String,
    pub components: Vec<ComponentStatus>,
    pub incidents: Vec<IncidentSummary>,
}

#[tauri::command]
pub async fn get_claude_status() -> Result<ClaudeStatus, String> {
    let resp = reqwest::Client::new()
        .get("https://status.claude.com/api/v2/summary.json")
        .timeout(std::time::Duration::from_secs(8))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    let indicator = json["status"]["indicator"]
        .as_str().unwrap_or("unknown").to_string();
    let description = json["status"]["description"]
        .as_str().unwrap_or("Unknown").to_string();

    // Keep only showcase (top-level) components, skip group headers
    let components = json["components"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter(|c| c["showcase"].as_bool().unwrap_or(false) && !c["group"].as_bool().unwrap_or(false))
        .map(|c| ComponentStatus {
            name: c["name"].as_str().unwrap_or("").to_string(),
            status: c["status"].as_str().unwrap_or("unknown").to_string(),
        })
        .collect();

    // Active incidents (not resolved)
    let incidents = json["incidents"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter(|i| i["status"].as_str().unwrap_or("") != "resolved")
        .map(|i| {
            let body = i["incident_updates"]
                .as_array()
                .and_then(|u| u.first())
                .and_then(|u| u["body"].as_str())
                .unwrap_or("")
                .to_string();
            IncidentSummary {
                name: i["name"].as_str().unwrap_or("").to_string(),
                status: i["status"].as_str().unwrap_or("").to_string(),
                body,
            }
        })
        .collect();

    Ok(ClaudeStatus { indicator, description, components, incidents })
}

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
