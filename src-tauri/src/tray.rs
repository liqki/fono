use super::window;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
};

/// Build the system tray for the application with a quit and settings option
pub fn build_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let settings_i = MenuItem::with_id(app, "settings", "Open Settings", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&settings_i, &quit_i])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::DoubleClick { .. } => {
                let app_handle = tray.app_handle();
                window::open_settings_window(&app_handle);
            }
            _ => {}
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "settings" => {
                window::open_settings_window(app);
            }
            _ => {}
        })
        .build(app)?;
    Ok(())
}
