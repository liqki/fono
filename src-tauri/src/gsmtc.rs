use base64::Engine;
use image::{
    codecs::png::PngEncoder, imageops::overlay, DynamicImage, ExtendedColorType, GenericImageView,
    ImageEncoder, Rgba, RgbaImage,
};
use once_cell::sync::OnceCell;
use std::{thread, time::Duration};
use tauri::{AppHandle, Emitter};
use windows::{
    core::Result as WinResult,
    Media::Control::{
        GlobalSystemMediaTransportControlsSession as Session,
        GlobalSystemMediaTransportControlsSessionManager as Manager,
    },
    Media::MediaPlaybackAutoRepeatMode,
    Storage::Streams::{DataReader, IRandomAccessStreamWithContentType},
};

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct Snapshot {
    pub app_id: Option<String>,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub playing: bool,
    pub repeat_mode: Option<String>,
    pub shuffle: bool,
    pub position_ms: Option<u64>,
    pub duration_ms: Option<u64>,
    pub thumbnail: Option<String>,
}

impl Default for Snapshot {
    fn default() -> Self {
        Snapshot {
            app_id: None,
            title: None,
            artist: None,
            album: None,
            playing: false,
            repeat_mode: None,
            shuffle: false,
            position_ms: None,
            duration_ms: None,
            thumbnail: None,
        }
    }
}

static MANAGER: OnceCell<Manager> = OnceCell::new();
static PREFERRED_APP: OnceCell<String> = OnceCell::new();

/// Spawn the gsmtc listener in a background thread and emit updates to the frontend
pub fn run(app_handle: AppHandle, preferred_app: String) -> WinResult<()> {
    thread::spawn(move || {
        let manager: Manager = match Manager::RequestAsync().and_then(|m| m.get()) {
            Ok(mgr) => mgr,
            Err(e) => {
                eprintln!("Failed to get gsmtc manager: {e:?}");
                return;
            }
        };
        MANAGER.set(manager.clone()).ok();
        PREFERRED_APP.set(preferred_app).ok();

        let mut last_snapshot = Snapshot::default();

        loop {
            let snapshot = snapshot_current(&manager).unwrap_or_default();

            if snapshot != last_snapshot {
                last_snapshot = snapshot.clone();
                app_handle.emit("gsmtc_update", snapshot.clone()).unwrap();
            }

            thread::sleep(Duration::from_millis(500));
        }
    });

    Ok(())
}

/// Get the current session while prioritizing the preferred app
fn get_session(manager: &Manager) -> Option<Session> {
    if let Ok(sessions) = manager.GetSessions() {
        for session in sessions {
            if let Ok(id) = session.SourceAppUserModelId() {
                if id.to_string().to_lowercase().contains(
                    &PREFERRED_APP
                        .get()
                        .map(|s| s.to_lowercase())
                        .unwrap_or_default(),
                ) {
                    return Some(session);
                }
            }
        }
    }
    let session: Session = manager.GetCurrentSession().ok()?;
    Some(session)
}

/// Get the snapshot of the current session
fn snapshot_current(manager: &Manager) -> Option<Snapshot> {
    let session = get_session(manager)?;
    Some(snapshot_session(&session))
}

/// Convert a session to a snapshot
fn snapshot_session(session: &Session) -> Snapshot {
    let mut snap = Snapshot::default();

    if let Ok(app_id_res) = session.SourceAppUserModelId() {
        snap.app_id = Some(app_id_res.to_string());
    }

    if let Ok(op) = session.TryGetMediaPropertiesAsync() {
        if let Ok(props) = op.get() {
            snap.title = props.Title().ok().map(|h| h.to_string());
            snap.artist = props.Artist().ok().map(|h| h.to_string());
            snap.album = props.AlbumTitle().ok().map(|h| h.to_string());

            if let Ok(thumb_ref) = props.Thumbnail() {
                if let Ok(stream) = thumb_ref.OpenReadAsync().and_then(|op| op.get()) {
                    if let Some(bytes) = thumbnail_to_bytes(&stream) {
                        // Only crop Spotify thumbnails
                        snap.thumbnail = if let Some(app_id) = &snap.app_id {
                            if app_id.to_lowercase().contains("spotify") {
                                crop_spotify_logo(&bytes)
                            } else {
                                pad_square(&bytes)
                            }
                        } else {
                            pad_square(&bytes)
                        };
                    }
                }
            }
        }
    }

    if let Ok(info) = session.GetPlaybackInfo() {
        snap.playing = matches!(
            info.PlaybackStatus().unwrap_or(windows::Media::Control::GlobalSystemMediaTransportControlsSessionPlaybackStatus::Closed),
            windows::Media::Control::GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing
        );
        snap.repeat_mode = match info.AutoRepeatMode().ok().and_then(|h| h.Value().ok()) {
            Some(MediaPlaybackAutoRepeatMode::None) => Some("off".to_string()),
            Some(MediaPlaybackAutoRepeatMode::List) => Some("context".to_string()),
            Some(MediaPlaybackAutoRepeatMode::Track) => Some("track".to_string()),
            _ => Some("off".to_string()),
        };
        snap.shuffle = info
            .IsShuffleActive()
            .ok()
            .and_then(|v| v.Value().ok())
            .unwrap_or(false);
    }

    if let Ok(timeline) = session.GetTimelineProperties() {
        snap.position_ms = Some((timeline.Position().unwrap_or_default().Duration / 10_000) as u64);
        snap.duration_ms = Some((timeline.EndTime().unwrap_or_default().Duration / 10_000) as u64);
    }

    snap
}

/// Convert a session thumbnail to bytes
fn thumbnail_to_bytes(thumb_ref: &IRandomAccessStreamWithContentType) -> Option<Vec<u8>> {
    let size = thumb_ref.Size().ok()? as u32;
    if size == 0 {
        return None;
    }

    let input_stream = thumb_ref.GetInputStreamAt(0).ok()?;

    let reader = DataReader::CreateDataReader(&input_stream).ok()?;
    reader.LoadAsync(size).ok()?.get().ok()?;

    let mut buffer = vec![0u8; size as usize];
    reader.ReadBytes(&mut buffer).ok()?;
    Some(buffer)
}

/// Enlarge non-square session thumbnails to a square by adding black borders
fn pad_square(bytes: &[u8]) -> Option<String> {
    let img = image::load_from_memory(bytes).ok()?;
    let (width, height) = img.dimensions();
    let size = width.max(height);

    let mut square = RgbaImage::from_pixel(size, size, Rgba([0, 0, 0, 255]));
    let x = (size - width) / 2;
    let y = (size - height) / 2;
    overlay(&mut square, &img.to_rgba8(), x.into(), y.into());
    encode_image(square)
}

/// Crop the spotify logo from a spotify session thumbnail
fn crop_spotify_logo(bytes: &[u8]) -> Option<String> {
    let img = image::load_from_memory(bytes).ok()?;

    let cropped = img.crop_imm(33, 0, 234, 234);

    encode_image(cropped)
}

/// Encode an image to a base64 string
fn encode_image<I>(img: I) -> Option<String>
where
    I: Into<DynamicImage>,
{
    let img = img.into();
    let mut buf = Vec::new();
    let encoder = PngEncoder::new(&mut buf);
    encoder
        .write_image(
            &img.to_rgba8(),
            img.width(),
            img.height(),
            ExtendedColorType::Rgba8,
        )
        .ok()?;
    Some(base64::engine::general_purpose::STANDARD.encode(&buf))
}

///
/// Frontend commands to manipulate playback state
///
#[tauri::command]
pub fn play() -> Result<(), String> {
    session_control(|session| {
        session
            .TryPlayAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn pause() -> Result<(), String> {
    session_control(|session| {
        session
            .TryPauseAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn skip_next() -> Result<(), String> {
    session_control(|session| {
        session
            .TrySkipNextAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn skip_previous() -> Result<(), String> {
    session_control(|session| {
        session
            .TrySkipPreviousAsync()
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn change_repeat_mode() -> Result<(), String> {
    session_control(|session| {
        let playback_info = session.GetPlaybackInfo().map_err(|e| e.to_string())?;
        let current_mode = playback_info
            .AutoRepeatMode()
            .ok()
            .and_then(|h| h.Value().ok());

        let next_mode = match current_mode {
            Some(MediaPlaybackAutoRepeatMode::List) => MediaPlaybackAutoRepeatMode::Track,
            Some(MediaPlaybackAutoRepeatMode::Track) => MediaPlaybackAutoRepeatMode::None,
            _ => MediaPlaybackAutoRepeatMode::List,
        };

        session
            .TryChangeAutoRepeatModeAsync(next_mode)
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn change_shuffle_mode() -> Result<(), String> {
    session_control(|session| {
        let playback_info = session.GetPlaybackInfo().map_err(|e| e.to_string())?;
        let current_mode = playback_info
            .IsShuffleActive()
            .ok()
            .and_then(|v| v.Value().ok())
            .unwrap_or(false);

        session
            .TryChangeShuffleActiveAsync(!current_mode)
            .map_err(|e| e.to_string())?
            .get()
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

/// Helper function to manipulate playback state using a closure
fn session_control<F>(f: F) -> Result<(), String>
where
    F: FnOnce(&Session) -> Result<(), String>,
{
    let manager = MANAGER.get().ok_or("GSMTC Manager not initialized")?;

    if let Some(session) = get_session(manager) {
        f(&session)
    } else {
        Err("Failed to get current session".into())
    }
}
