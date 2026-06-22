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
    AppHandle, Manager, WebviewWindow,
};

fn toggle_popup(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("popup") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            position_popup_near_tray(app, &win);
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}

fn position_popup_near_tray(_app: &AppHandle, win: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        if let Ok(monitor) = win.current_monitor() {
            if let Some(monitor) = monitor {
                let size = monitor.size();
                let win_size = win.outer_size().unwrap_or_default();
                let x = (size.width as i32) - (win_size.width as i32) - 20;
                let y = 24;
                let _ = win.set_position(tauri::Position::Physical(
                    tauri::PhysicalPosition { x, y },
                ));
            }
        }
    }
}

#[tauri::command]
async fn open_settings_window(app: AppHandle) {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.show();
        let _ = win.set_focus();
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

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TokenTracker")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event({
                    let handle = handle.clone();
                    move |_tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            toggle_popup(&handle);
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

            // Start background polling
            if let Some(pool) = app.try_state::<db::Db>() {
                poller::start(handle.clone(), pool.inner().clone());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_settings_window,
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
