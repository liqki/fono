mod gsmtc;
mod store;
mod tray;
mod window;

use gsmtc::*;
use window::update_settings;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            update_settings,
            play,
            pause,
            skip_next,
            skip_previous,
            change_repeat_mode,
            change_shuffle_mode
        ])
        .setup(|app| {
            let preferred_app = store::initialize_window_settings(&app)
                .expect("Failed to initialize window settings");

            gsmtc::run(app.handle().clone(), preferred_app).expect("Failed to run gsmtc");

            tray::build_tray(&app).expect("Failed to build tray");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
