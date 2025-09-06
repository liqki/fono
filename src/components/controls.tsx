import { invoke } from "@tauri-apps/api/core";
import { TbArrowsShuffle, TbRepeat, TbRepeatOnce } from "react-icons/tb";

import type { DynamicColors } from "../util/dynamic-theme";

import { useSettings } from "../context/settings-context";
import { getThemeColor } from "../util/dynamic-theme";
import Icon from "./icon";

type ControlsProps = {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  repeat: "off" | "context" | "track";
  shuffle: boolean;
  iconStyle: "filled" | "outline" | "none";
  dynamicColors: DynamicColors | null;
};

function Controls({ isPlaying, duration, currentTime, repeat, shuffle, iconStyle, dynamicColors }: ControlsProps) {
  const { settings } = useSettings();

  return (
    <div className="w-full flex flex-col items-center gap-[2px]">
      <div className={`${settings.iconStyle === "none" ? "hidden" : "flex justify-between w-full items-center"}`}>
        <div onClick={() => invoke("change_repeat_mode")}>
          {repeat === "track"
            ? <TbRepeatOnce className="w-6" style={{ color: getThemeColor(settings.primaryColor, dynamicColors?.primary, settings.dynamicTheme) }} />
            : (
                <TbRepeat
                  className="w-6"
                  style={{ color: repeat === "context"
                    ? getThemeColor(settings.primaryColor, dynamicColors?.primary, settings.dynamicTheme)
                    : getThemeColor(settings.textColor, dynamicColors?.text, settings.dynamicTheme) }}
                />
              )}
        </div>
        <div className="flex justify-center items-center gap-2">
          <Icon name="skipStart" variant={iconStyle} className="text-2xl" onClick={() => invoke("skip_previous")} />
          {isPlaying
            ? (
                <Icon name="pause" variant={iconStyle} className="text-3xl" onClick={() => invoke("pause")} />
              )
            : (
                <Icon name="play" variant={iconStyle} className="text-3xl" onClick={() => invoke("play")} />
              )}
          <Icon name="skipEnd" variant={iconStyle} className="text-2xl" onClick={() => invoke("skip_next")} />
        </div>
        <TbArrowsShuffle className="w-6" style={{ color: shuffle ? settings.dynamicTheme ? dynamicColors?.primary : settings.primaryColor : settings.textColor }} onClick={() => invoke("change_shuffle_mode")} />
      </div>
      <div className="h-2 w-full relative">
        <div className="h-1 w-full rounded-full overflow-hidden absolute bottom-0" style={{ backgroundColor: getThemeColor(settings.backgroundColor, dynamicColors?.background, settings.dynamicTheme) }}>
          <div className="h-full transition-[width] duration-[30ms]" style={{ backgroundColor: getThemeColor(settings.primaryColor, dynamicColors?.primary, settings.dynamicTheme), width: `${(currentTime / duration) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default Controls;
