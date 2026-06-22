mod db;
mod models;
mod keychain;
mod pricing;
mod providers;
mod commands;
mod poller;
mod license;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State, WebviewWindow,
};
use crate::db::Db;

const TRAY_ID: &str = "main";

fn dot_image() -> tauri::image::Image<'static> {
    const W: usize = 22;
    const H: usize = 22;
    let (cx, cy, radius) = (W as f32 / 2.0, H as f32 / 2.0, 6.0f32);
    let mut rgba = vec![0u8; W * H * 4];
    for y in 0..H {
        for x in 0..W {
            let dx = x as f32 + 0.5 - cx;
            let dy = y as f32 + 0.5 - cy;
            let d = (dx * dx + dy * dy).sqrt();
            let a = if d < radius - 1.0 { 255 } else if d < radius { ((radius - d) * 255.0) as u8 } else { 0 };
            let i = (y * W + x) * 4;
            rgba[i] = 240; rgba[i+1] = 168; rgba[i+2] = 80; rgba[i+3] = a;
        }
    }
    tauri::image::Image::new_owned(rgba, W as u32, H as u32)
}

fn progress_image(pct: f64) -> tauri::image::Image<'static> {
    const W: usize = 38;
    const H: usize = 16;
    let mut rgba = vec![0u8; W * H * 4];
    let bars = 5usize;
    let bar_w = 5usize;
    let gap = 2usize;
    let total = bars * bar_w + (bars - 1) * gap;
    let sx = (W - total) / 2;
    let filled = ((pct.clamp(0.0, 100.0) / 100.0 * bars as f64).round() as usize).min(bars);
    for b in 0..bars {
        let bx = sx + b * (bar_w + gap);
        let (fr, fg, fb, fa): (u8, u8, u8, u8) = if b < filled { (240, 168, 80, 230) } else { (80, 80, 85, 160) };
        for y in 2..(H - 2) {
            for x in bx..(bx + bar_w) {
                let i = (y * W + x) * 4;
                rgba[i] = fr; rgba[i+1] = fg; rgba[i+2] = fb; rgba[i+3] = fa;
            }
        }
    }
    tauri::image::Image::new_owned(rgba, W as u32, H as u32)
}

fn toggle_popup(app: &AppHandle, icon_x: f64) {
    if let Some(win) = app.get_webview_window("popup") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            position_popup_near_tray(app, &win, icon_x);
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}

fn position_popup_near_tray(_app: &AppHandle, win: &WebviewWindow, icon_x: f64) {
    #[cfg(target_os = "macos")]
    {
        let monitor = win.primary_monitor().ok().flatten()
            .or_else(|| win.current_monitor().ok().flatten());

        if let Some(monitor) = monitor {
            let scale = monitor.scale_factor();
            let m_pos = monitor.position();
            let m_size = monitor.size();

            // Use logical popup size from config (340x580) → physical pixels
            let popup_w = (340.0 * scale).round() as i32;

            // macOS menu bar is 24pt logical → physical pixels
            let menubar_h = (24.0 * scale).round() as i32;

            // Center the popup under the tray icon click position, clamped to screen
            let x = (icon_x as i32 - popup_w / 2)
                .clamp(m_pos.x, m_pos.x + (m_size.width as i32) - popup_w);
            let y = m_pos.y + menubar_h;

            let _ = win.set_position(tauri::Position::Physical(
                tauri::PhysicalPosition { x, y },
            ));
        }
    }
}

pub async fn refresh_tray(app: &AppHandle, db: &Db) {
    // Read icon style from settings
    let style: String = sqlx::query_scalar(
        "SELECT value FROM settings WHERE key = 'icon_style'"
    )
    .fetch_optional(db)
    .await
    .ok()
    .flatten()
    .unwrap_or_else(|| "icon_usage".to_string());

    // Get all enabled providers then fetch latest snapshot for each
    use sqlx::Row;
    let provider_ids: Vec<String> = sqlx::query(
        "SELECT id FROM providers WHERE enabled = 1"
    )
    .fetch_all(db)
    .await
    .unwrap_or_default()
    .iter()
    .map(|r| r.get("id"))
    .collect();

    let mut total_cost = 0.0f64;
    let mut max_pct: Option<f64> = None;

    for pid in &provider_ids {
        let row = sqlx::query(
            "SELECT tokens_used, tokens_limit, cost_usd, raw_json FROM usage_snapshots WHERE provider_id = ? ORDER BY captured_at DESC LIMIT 1"
        )
        .bind(pid)
        .fetch_optional(db)
        .await
        .ok()
        .flatten();

        let Some(row) = row else { continue };

        let cost: Option<f64> = row.try_get("cost_usd").ok().flatten();
        let used: Option<i64> = row.try_get("tokens_used").ok().flatten();
        let limit: Option<i64> = row.try_get("tokens_limit").ok().flatten();
        let raw: Option<String> = row.try_get("raw_json").ok().flatten();

        total_cost += cost.unwrap_or(0.0);

        let pct = raw
            .as_deref()
            .and_then(|j| serde_json::from_str::<serde_json::Value>(j).ok())
            .and_then(|v| {
                v.get("seven_day")
                    .and_then(|x| x.get("utilization"))
                    .and_then(|x| x.as_f64())
                    .map(|p| p * 100.0)
            })
            .or_else(|| match (used, limit) {
                (Some(u), Some(l)) if l > 0 => Some((u as f64 / l as f64) * 100.0),
                _ => None,
            });

        if let Some(p) = pct {
            max_pct = Some(max_pct.map_or(p, |m: f64| m.max(p)));
        }
    }

    let cost_str = if total_cost >= 0.01 { Some(format!("${:.2}", total_cost)) } else { None };
    let pct_str  = max_pct.map(|p| format!("{:.0}%", p));

    let pancake = tauri::include_image!("icons/tray-icon.png");

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        match style.as_str() {
            "compact_dot" => {
                let _ = tray.set_icon(Some(dot_image()));
                let _ = tray.set_title(None::<&str>);
            }
            "progress" => {
                let _ = tray.set_icon(Some(progress_image(max_pct.unwrap_or(0.0))));
                let _ = tray.set_title(None::<&str>);
            }
            other => {
                let _ = tray.set_icon(Some(pancake));
                let title = match other {
                    "icon_only"  => None,
                    "icon_cost"  => Some(format!("${:.2}", total_cost)),
                    "icon_usage" => pct_str.or(cost_str),
                    "usage_only" => pct_str.or(cost_str),
                    _            => None,
                };
                let _ = tray.set_title(title.as_deref());
            }
        }
    }
}

#[tauri::command]
async fn trigger_tray_refresh(app: AppHandle, db: State<'_, Db>) -> Result<(), String> {
    refresh_tray(&app, db.inner()).await;
    Ok(())
}

#[tauri::command]
async fn open_settings_window(app: AppHandle) {
    if let Some(popup) = app.get_webview_window("popup") {
        let _ = popup.hide();
    }
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.show();
        let _ = win.set_focus();
        #[cfg(target_os = "macos")]
        let _ = win.set_always_on_top(true);
        #[cfg(target_os = "macos")]
        let _ = win.set_always_on_top(false);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            // Hide from Dock on macOS
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Prevent settings window from being destroyed on close — hide instead
            if let Some(settings) = app.get_webview_window("settings") {
                let handle_s = handle.clone();
                settings.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(win) = handle_s.get_webview_window("settings") {
                            let _ = win.hide();
                        }
                    }
                });
            }

            // Init DB
            tauri::async_runtime::block_on(async {
                match db::init().await {
                    Ok(pool) => {
                        app.manage(pool);
                    }
                    Err(e) => {
                        eprintln!("DB init error: {e}");
                    }
                }
            });

            // Tray icon
            let quit = MenuItem::with_id(app, "quit", "Quit TokenTracker", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&settings_item, &quit])?;

            let tray = TrayIconBuilder::with_id(TRAY_ID)
                .icon(tauri::include_image!("icons/tray-icon.png"))
                .icon_as_template(false)
                .tooltip("TokenTracker")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event({
                    let handle = handle.clone();
                    move |_tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            position,
                            ..
                        } = event
                        {
                            toggle_popup(&handle, position.x);
                        }
                    }
                })
                .on_menu_event({
                    let handle = handle.clone();
                    move |app, event| match event.id.as_ref() {
                        "quit" => app.exit(0),
                        "settings" => {
                            if let Some(win) = app.get_webview_window("settings") {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            drop(tray); // Tauri keeps tray alive via its internal registry

            // Start background polling
            if let Some(pool) = app.try_state::<db::Db>() {
                poller::start(handle.clone(), pool.inner().clone());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_settings_window,
            trigger_tray_refresh,
            commands::providers::get_all_providers,
            commands::providers::update_provider,
            commands::usage::get_today_summary,
            commands::usage::get_weekly_spend,
            commands::usage::get_latest_snapshot,
            commands::usage::get_subscriptions,
            commands::usage::upsert_subscription,
            commands::usage::delete_subscription,
            commands::settings::get_settings,
            commands::settings::set_setting,
            commands::sync::sync_provider,
            commands::sync::sync_all_providers,
            keychain::set_provider_secret,
            keychain::has_provider_secret,
            keychain::delete_provider_secret,
            license::get_license_info,
            license::activate_license,
            license::is_pro,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
