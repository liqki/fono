use super::window;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Debug)]
struct Settings {
    mode: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    preferred_app: Option<String>,
}

/// Initialize window settings from the store on startup
pub fn initialize_window_settings(app: &tauri::App) -> Result<String, tauri_plugin_store::Error> {
    let store = app.store("settings.json")?;
    let app_handle = app.handle().clone();
    let json_value: Option<JsonValue> = store.get("settings");
    if let Some(json_value) = json_value {
        let settings: Settings =
            serde_json::from_value(json_value).expect("Failed to parse settings");
        window::apply_window_settings(
            &app_handle,
            settings.mode.unwrap_or_else(|| "overlay".into()),
            settings.width.unwrap_or_else(|| 200),
            settings.height.unwrap_or_else(|| 300),
        );
        store.close_resource();
        return Ok(settings
            .preferred_app
            .unwrap_or_else(|| "spotify".to_string()));
    }
    store.close_resource();
    Ok("spotify".to_string())
}
