use tauri::Manager;

/// Update the application window dimensions on frontend configuration change
#[tauri::command]
pub fn update_settings(app_handle: tauri::AppHandle, mode: String, width: u32, height: u32) {
    apply_window_settings(&app_handle, mode, width, height);
}

/// Apply the given dimension settings to the widget window
pub fn apply_window_settings(app_handle: &tauri::AppHandle, mode: String, width: u32, height: u32) {
    let window = app_handle.get_webview_window("fono").unwrap();
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: width.into(),
            height: height.into(),
        }))
        .unwrap();
    match mode.as_str() {
        "overlay" => {
            window.set_always_on_bottom(false).unwrap();
            window.set_always_on_top(true).unwrap();
        }
        "widget" => {
            window.set_always_on_top(false).unwrap();
            window.set_always_on_bottom(true).unwrap();
        }
        _ => {}
    }
}

/// Open the settings window or focus it if already opened
pub fn open_settings_window(app_handle: &tauri::AppHandle) {
    if let Some(window) = app_handle.get_webview_window("settings") {
        window.unminimize().unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        let settings_window = tauri::WebviewWindowBuilder::new(
            app_handle,
            "settings",
            tauri::WebviewUrl::App("index.html/#/settings".into()),
        )
        .title("Settings")
        .inner_size(800.into(), 520.into())
        .resizable(false)
        .maximizable(false)
        .minimizable(true)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .center()
        .build();

        if let Ok(window) = settings_window {
            window.set_focus().unwrap();
        }
    }
}
