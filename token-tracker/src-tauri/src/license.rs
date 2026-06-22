use sqlx::Row;
use anyhow::Result;
use crate::{db::Db, keychain, models::LicenseInfo};

const LICENSE_KEYCHAIN_KEY: &str = "license_status";
const GUMROAD_PRODUCT_ID: &str = "tokentracker-pro";

#[derive(serde::Deserialize, Debug)]
struct GumroadResponse {
    success: bool,
}

pub fn is_pro_cached() -> bool {
    keychain::get_secret(LICENSE_KEYCHAIN_KEY)
        .map(|v| v.as_deref() == Some("pro"))
        .unwrap_or(false)
}

#[tauri::command]
pub async fn get_license_info(db: State<'_, Db>) -> Result<LicenseInfo, String> {
    if is_pro_cached() {
        let row = sqlx::query("SELECT value FROM settings WHERE key = 'license_activated_at'")
            .fetch_optional(db.inner())
            .await
            .map_err(|e| e.to_string())?;
        let activated_at = row.and_then(|r: sqlx::sqlite::SqliteRow| {
            r.get::<Option<String>, _>("value")
                .and_then(|v| v.parse::<i64>().ok())
        });
        let key_row = sqlx::query("SELECT value FROM settings WHERE key = 'license_key'")
            .fetch_optional(db.inner())
            .await
            .ok()
            .flatten()
            .map(|r: sqlx::sqlite::SqliteRow| r.get::<Option<String>, _>("value"))
            .flatten();
        Ok(LicenseInfo { tier: "pro".into(), activated_at, key: key_row })
    } else {
        Ok(LicenseInfo { tier: "free".into(), activated_at: None, key: None })
    }
}

#[tauri::command]
pub async fn activate_license(key: String, db: State<'_, Db>) -> Result<LicenseInfo, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.gumroad.com/v2/licenses/verify")
        .form(&[
            ("product_id", GUMROAD_PRODUCT_ID),
            ("license_key", key.as_str()),
        ])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body: GumroadResponse = resp.json().await.map_err(|e| e.to_string())?;
    if !body.success {
        return Err("Invalid license key".into());
    }

    keychain::set_secret(LICENSE_KEYCHAIN_KEY, "pro").map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp();

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_key', ?)")
        .bind(&key)
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_activated_at', ?)")
        .bind(now.to_string())
        .execute(db.inner())
        .await
        .map_err(|e| e.to_string())?;

    Ok(LicenseInfo { tier: "pro".into(), activated_at: Some(now), key: Some(key) })
}

#[tauri::command]
pub fn is_pro() -> bool {
    is_pro_cached()
}

use tauri::State;
