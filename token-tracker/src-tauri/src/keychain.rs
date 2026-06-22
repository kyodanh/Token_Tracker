use std::collections::HashMap;
use std::path::PathBuf;
use anyhow::Result;

fn creds_path() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("TokenTracker")
        .join("credentials.json")
}

fn load() -> HashMap<String, String> {
    let path = creds_path();
    if !path.exists() {
        return HashMap::new();
    }
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save(creds: &HashMap<String, String>) -> Result<()> {
    let path = creds_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&path, serde_json::to_string(creds)?)?;
    Ok(())
}

pub fn set_secret(key: &str, value: &str) -> Result<()> {
    let mut creds = load();
    creds.insert(key.to_string(), value.to_string());
    save(&creds)
}

pub fn get_secret(key: &str) -> Result<Option<String>> {
    Ok(load().get(key).cloned())
}

pub fn delete_secret(key: &str) -> Result<()> {
    let mut creds = load();
    creds.remove(key);
    save(&creds)
}

#[tauri::command]
pub fn set_provider_secret(provider_id: String, secret: String) -> Result<(), String> {
    set_secret(&provider_id, &secret).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn has_provider_secret(provider_id: String) -> bool {
    get_secret(&provider_id)
        .map(|v| v.is_some())
        .unwrap_or(false)
}

#[tauri::command]
pub fn delete_provider_secret(provider_id: String) -> Result<(), String> {
    delete_secret(&provider_id).map_err(|e| e.to_string())
}
