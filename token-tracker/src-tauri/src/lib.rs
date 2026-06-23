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
    AppHandle, Emitter, Manager, State, WebviewWindow,
};
use crate::db::Db;

const TRAY_ID: &str = "main";


fn coffee_image() -> tauri::image::Image<'static> {
    const W: usize = 22;
    const H: usize = 28;

    let mut rgba = vec![0u8; W * H * 4];

    macro_rules! px {
        ($x:expr, $y:expr, $a:expr) => {{
            let (x, y, a): (usize, usize, u8) = ($x, $y, $a);
            if x < W && y < H {
                let i = (y * W + x) * 4;
                rgba[i] = 0; rgba[i+1] = 0; rgba[i+2] = 0; rgba[i+3] = a;
            }
        }};
    }

    // Steam
    for y in 1..5usize { px!(6, y, 120); px!(11, y, 120); }

    // Cup rim
    for x in 2..19usize { px!(x, 5, 220); px!(x, 6, 220); }

    // Cup body
    for y in 7..19usize {
        let (lx, rx): (usize, usize) = if y == 18 { (3, 17) } else { (2, 18) };
        for x in lx..rx { px!(x, y, 210); }
    }

    // Handle outline
    for x in 17..21usize { px!(x, 8, 190); px!(x, 15, 190); }
    for y in 9..15usize { px!(18, y, 190); px!(19, y, 190); }

    // Saucer
    for x in 0..22usize { px!(x, 19, 190); }
    for x in 1..21usize { px!(x, 20, 150); }

    tauri::image::Image::new_owned(rgba, W as u32, H as u32)
}


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

/// Windows: render ≤3-char text into a 22×22 RGBA tray icon using a 3×5 pixel font at 2× scale.
#[cfg(target_os = "windows")]
fn text_tray_image(text: &str) -> tauri::image::Image<'static> {
    const W: usize = 22;
    const H: usize = 22;
    const CHAR_W: usize = 3;
    const CHAR_H: usize = 5;
    const SCALE: usize = 2;
    const GAP: usize = 1;

    fn glyph(c: char) -> [u8; 5] {
        match c {
            '0' => [0b111, 0b101, 0b101, 0b101, 0b111],
            '1' => [0b010, 0b110, 0b010, 0b010, 0b111],
            '2' => [0b111, 0b001, 0b111, 0b100, 0b111],
            '3' => [0b111, 0b001, 0b111, 0b001, 0b111],
            '4' => [0b101, 0b101, 0b111, 0b001, 0b001],
            '5' => [0b111, 0b100, 0b111, 0b001, 0b111],
            '6' => [0b111, 0b100, 0b111, 0b101, 0b111],
            '7' => [0b111, 0b001, 0b001, 0b001, 0b001],
            '8' => [0b111, 0b101, 0b111, 0b101, 0b111],
            '9' => [0b111, 0b101, 0b111, 0b001, 0b111],
            '$' => [0b010, 0b111, 0b110, 0b111, 0b010],
            '%' => [0b101, 0b001, 0b010, 0b100, 0b101],
            'c' => [0b011, 0b100, 0b100, 0b100, 0b011],
            '.' => [0b000, 0b000, 0b000, 0b010, 0b110],
            _   => [0b000; 5],
        }
    }

    let chars: Vec<char> = text.chars().take(3).collect();
    let n = chars.len();
    let text_px_w = if n > 0 { (CHAR_W + GAP) * n - GAP } else { 0 };
    let ox = (W.saturating_sub(text_px_w * SCALE)) / 2;
    let oy = (H.saturating_sub(CHAR_H * SCALE)) / 2;
    let mut rgba = vec![0u8; W * H * 4];

    for (ci, &c) in chars.iter().enumerate() {
        let rows = glyph(c);
        let bx = ox + ci * (CHAR_W + GAP) * SCALE;
        for (row, &mask) in rows.iter().enumerate() {
            for col in 0..CHAR_W {
                if (mask >> (CHAR_W - 1 - col)) & 1 == 0 { continue; }
                for sy in 0..SCALE {
                    for sx in 0..SCALE {
                        let px = bx + col * SCALE + sx;
                        let py = oy + row * SCALE + sy;
                        if px < W && py < H {
                            let i = (py * W + px) * 4;
                            rgba[i] = 255; rgba[i+1] = 255; rgba[i+2] = 255; rgba[i+3] = 230;
                        }
                    }
                }
            }
        }
    }
    tauri::image::Image::new_owned(rgba, W as u32, H as u32)
}

/// Windows: format cost/percentage as ≤3-char string for tray icon text.
#[cfg(target_os = "windows")]
fn windows_tray_text(max_pct: Option<f64>, total_cost: f64, style: &str) -> Option<String> {
    if style == "icon_only" { return None; }
    if style == "icon_cost" {
        return if total_cost >= 0.005 { Some(win_cost_fmt(total_cost)) } else { None };
    }
    if let Some(p) = max_pct {
        return Some(format!("{:.0}%", p.clamp(0.0, 99.0)));
    }
    if total_cost >= 0.005 { Some(win_cost_fmt(total_cost)) } else { None }
}

#[cfg(target_os = "windows")]
fn win_cost_fmt(cost: f64) -> String {
    if cost >= 10.0 { format!("${:.0}", cost.min(99.0)) }
    else if cost >= 1.0 { format!("${:.0}", cost) }
    else { format!("{}c", ((cost * 100.0).round() as u32).min(99)) }
}

fn toggle_popup(app: &AppHandle, icon_x: f64, icon_y: f64) {
    if let Some(win) = app.get_webview_window("popup") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            let arrow_x = position_popup_near_tray(&win, icon_x, icon_y);
            let _ = win.show();
            let _ = win.set_focus();
            // Emit after show so the WebView is visible when it processes the event
            let _ = app.emit("popup_show", arrow_x);
        }
    }
}

/// Positions the popup window near the tray icon.
/// Returns the arrow x offset in logical pixels (0..340) from the popup's left edge.
fn position_popup_near_tray(win: &WebviewWindow, icon_x: f64, icon_y: f64) -> f64 {
    #[cfg(target_os = "macos")]
    {
        let _ = icon_y; // icon_y is used only on non-macOS platforms
        let monitor = win.primary_monitor().ok().flatten()
            .or_else(|| win.current_monitor().ok().flatten());

        if let Some(monitor) = monitor {
            let scale = monitor.scale_factor();
            let m_pos = monitor.position();
            let m_size = monitor.size();

            let popup_w = (340.0 * scale).round() as i32;
            // macOS menu bar is 24pt logical → physical pixels
            let menubar_h = (24.0 * scale).round() as i32;

            let x = (icon_x as i32 - popup_w / 2)
                .clamp(m_pos.x, m_pos.x + (m_size.width as i32) - popup_w);
            let y = m_pos.y + menubar_h;

            let _ = win.set_position(tauri::Position::Physical(
                tauri::PhysicalPosition { x, y },
            ));

            let arrow_x_physical = icon_x as i32 - x;
            let arrow_x_logical = arrow_x_physical as f64 / scale;
            return arrow_x_logical.clamp(20.0, 320.0);
        }
    }

    // Windows / Linux: position popup above the tray icon click point
    #[cfg(not(target_os = "macos"))]
    {
        let monitor = win.primary_monitor().ok().flatten()
            .or_else(|| win.current_monitor().ok().flatten());

        if let Some(monitor) = monitor {
            let scale = monitor.scale_factor();
            let m_pos = monitor.position();
            let m_size = monitor.size();

            let popup_w = (340.0 * scale).round() as i32;
            let popup_h = (590.0 * scale).round() as i32;
            let gap = (8.0 * scale).round() as i32;

            // Center horizontally on click, place above click (above taskbar)
            let x = (icon_x as i32 - popup_w / 2)
                .clamp(m_pos.x, m_pos.x + m_size.width as i32 - popup_w);
            let y = (icon_y as i32 - popup_h - gap)
                .clamp(m_pos.y, m_pos.y + m_size.height as i32 - popup_h);

            let _ = win.set_position(tauri::Position::Physical(
                tauri::PhysicalPosition { x, y },
            ));

            let arrow_x_physical = icon_x as i32 - x;
            let arrow_x_logical = arrow_x_physical as f64 / scale;
            return arrow_x_logical.clamp(20.0, 320.0);
        }
    }

    170.0 // fallback: center of 340px popup
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

        // Session usage takes priority — consistent with what the popup shows.
        // seven_day.utilization is already in percent (0-100), used only as fallback.
        let pct = match (used, limit) {
            (Some(u), Some(l)) if l > 0 => Some((u as f64 / l as f64) * 100.0),
            _ => raw
                .as_deref()
                .and_then(|j| serde_json::from_str::<serde_json::Value>(j).ok())
                .and_then(|v| {
                    v.get("seven_day")
                        .and_then(|x| x.get("utilization"))
                        .and_then(|x| x.as_f64())
                }),
        };

        if let Some(p) = pct {
            max_pct = Some(max_pct.map_or(p, |m: f64| m.max(p)));
        }
    }

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        match style.as_str() {
            "compact_dot" => {
                let _ = tray.set_icon(Some(dot_image()));
                #[cfg(target_os = "macos")]
                let _ = tray.set_title(None::<&str>);
            }
            "progress" => {
                let _ = tray.set_icon(Some(progress_image(max_pct.unwrap_or(0.0))));
                #[cfg(target_os = "macos")]
                let _ = tray.set_title(None::<&str>);
            }
            other => {
                // macOS: text next to menu bar icon via set_title
                #[cfg(target_os = "macos")]
                {
                    // Replace ASCII digits with Unicode Mathematical Bold digits (𝟎–𝟗)
                    fn bold_digits(s: &str) -> String {
                        s.chars().map(|c| match c {
                            '0'..='9' => char::from_u32(0x1D7CE + (c as u32 - '0' as u32)).unwrap_or(c),
                            _ => c,
                        }).collect()
                    }
                    let _ = tray.set_icon(Some(coffee_image()));
                    let title: Option<String> = match other {
                        "icon_only" => None,
                        "icon_cost" => {
                            if total_cost >= 0.01 { Some(format!("${:.2}", total_cost)) } else { None }
                        }
                        _ => max_pct
                            .map(|p| bold_digits(&format!("{:.0}%", p)))
                            .or_else(|| {
                                if total_cost >= 0.01 { Some(format!("${:.2}", total_cost)) } else { None }
                            }),
                    };
                    let _ = tray.set_title(title.as_deref());
                }

                // Windows: bake text into the tray icon image; set_title is a no-op on Windows
                #[cfg(target_os = "windows")]
                {
                    let text_opt = windows_tray_text(max_pct, total_cost, other);
                    match text_opt {
                        Some(ref t) => {
                            let _ = tray.set_icon(Some(text_tray_image(t)));
                            let tooltip = format!("TokenTracker \u{2014} {}", t);
                            let _ = tray.set_tooltip(Some(tooltip.as_str()));
                        }
                        None => {
                            let _ = tray.set_icon(Some(coffee_image()));
                            let _ = tray.set_tooltip(Some("TokenTracker"));
                        }
                    }
                }

                // Linux: icon only (no title API, no text-in-icon for now)
                #[cfg(not(any(target_os = "macos", target_os = "windows")))]
                {
                    let _ = tray.set_icon(Some(coffee_image()));
                }
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
                            toggle_popup(&handle, position.x, position.y);
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
            commands::providers::get_claude_plan,
            commands::providers::add_claude_code_account,
            commands::providers::remove_claude_code_account,
            commands::providers::get_claude_code_config_path,
            commands::providers::start_claude_login,
            commands::providers::check_claude_login_status,
            commands::providers::scan_claude_code_dirs,
            commands::providers::add_claude_web_account,
            commands::providers::remove_claude_web_account,
            commands::usage::get_today_summary,
            commands::usage::get_weekly_spend,
            commands::usage::get_latest_snapshot,
            commands::usage::get_subscriptions,
            commands::usage::upsert_subscription,
            commands::usage::delete_subscription,
            commands::usage::check_and_advance_resets,
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
