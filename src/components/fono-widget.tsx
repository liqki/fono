import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

import { useSettings } from "../context/settings-context";
import { getThemeColor, useDynamicTheme } from "../util/dynamic-theme";
import Controls from "./controls";

type MediaState = {
  app_id: string | null;
  title: string | null;
  artist: string | null;
  album: string | null;
  playing: boolean;
  repeat_mode: "off" | "context" | "track" | null;
  shuffle: boolean;
  position_ms: number | null;
  duration_ms: number | null;
  thumbnail: string | null;
};

function NowPlaying() {
  const [mediaState, setMediaState] = useState<MediaState | null>(null);
  const [position, setPosition] = useState<number>(0);

  const { settings } = useSettings();

  const playingRef = useRef(false);
  const lastTimeRef = useRef(performance.now());

  const imgRef = useRef<HTMLImageElement>(null);
  const { colors } = useDynamicTheme(imgRef);

  const formatTitle = () => {
    if (!mediaState?.title)
      return "";
    const { title } = mediaState;
    const parts = title.split(" - ");
    let mainPart = parts.length > 1 ? parts[1] : title;
    mainPart = mainPart.replace(/\s*\(.*?\)\s*/g, "").trim();
    return mainPart;
  };

  useEffect(() => {
    playingRef.current = !!mediaState?.playing;
  }, [mediaState?.playing]);

  useEffect(() => {
    const unsubscribe = listen<MediaState>("gsmtc_update", (event) => {
      setMediaState(event.payload);
      setPosition(event.payload.position_ms || 0);
    });

    let frameId: number;

    const update = (time: number) => {
      if (playingRef.current) {
        const delta = time - lastTimeRef.current;
        setPosition(prev => prev + delta);
      }
      lastTimeRef.current = time;
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => {
      unsubscribe.then(unsub => unsub());
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (mediaState?.playing) {
      lastTimeRef.current = performance.now();
    }
  }, [mediaState?.playing]);

  return (
    <main
      data-tauri-drag-region={!settings.lockWidget}
      className="w-screen h-screen p-2 overflow-hidden box-border select-none group"
      style={{ backgroundColor: `${getThemeColor(settings.backgroundColor, colors?.background, settings.dynamicTheme)}${settings.backgroundOpacity >= 100 ? "" : settings.backgroundOpacity === 0 ? "00" : settings.backgroundOpacity}`, color: getThemeColor(settings.textColor, colors?.text, settings.dynamicTheme), borderRadius: settings.borderRadius }}
    >
      <div data-tauri-drag-region={!settings.lockWidget} className={`w-full h-full flex gap-1 ${settings.alignment === "horizontal" ? "flex-row" : "flex-col"}`}>
        {mediaState?.app_id
          ? (
              <>
                <img
                  ref={imgRef}
                  className={`aspect-square hover:cursor-pointer hover:scale-[1.01] transition-transform ${settings.alignment === "vertical" ? "w-full" : "h-full"}`}
                  style={{ borderRadius: settings.borderRadius }}
                  src={`data:image/png;base64,${mediaState.thumbnail}`}
                  onDragStart={e => e.preventDefault()}
                />
                <div data-tauri-drag-region={!settings.lockWidget} className={`flex-1 flex flex-col justify-between items-center ${settings.alignment === "vertical" ? "gap-2" : null}`}>
                  <div data-tauri-drag-region={!settings.lockWidget} className="flex flex-col justify-center items-center">
                    <p className="font-semibold truncate max-w-56 hover:cursor-pointer hover:underline">{formatTitle()}</p>
                    <p className={`max-w-56 truncate text-sm ${settings.alignment === "vertical" ? "px-4" : null}`}>{mediaState.artist}</p>
                  </div>
                  <Controls
                    isPlaying={mediaState.playing || false}
                    duration={mediaState.duration_ms || 0}
                    currentTime={position}
                    repeat={mediaState.repeat_mode || "off"}
                    shuffle={mediaState.shuffle || false}
                    iconStyle={settings.iconStyle}
                    dynamicColors={colors}
                  />
                </div>
              </>
            )
          : (
              <>
                <div className={`aspect-square bg-gray-600 ${settings.alignment === "vertical" ? "w-full" : "h-full"}`} style={{ borderRadius: settings.borderRadius }} />
                <p className="font-semibold">No media session</p>
              </>
            )}
      </div>
    </main>
  );
}

export default NowPlaying;
