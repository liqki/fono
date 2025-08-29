import { invoke } from "@tauri-apps/api/core";
import { TbArrowsShuffle, TbRepeat, TbRepeatOnce } from "react-icons/tb";

import { useSettings } from "../context/settings-context";
import Icon from "./icon";

type ControlsProps = {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  repeat: "off" | "context" | "track";
  shuffle: boolean;
  iconStyle: "filled" | "outline" | "none";
};

function Controls({ isPlaying, duration, currentTime, repeat, shuffle, iconStyle }: ControlsProps) {
  const { settings } = useSettings();

  return (
    <div className="w-full flex flex-col items-center gap-[2px]">
      <div className={`${settings.iconStyle === "none" ? "hidden" : "flex justify-between w-full items-center"}`}>
        <div onClick={() => invoke("change_repeat_mode")}>
          {repeat === "track"
            ? <TbRepeatOnce className="w-6" style={{ color: settings.primaryColor }} />
            : <TbRepeat className="w-6" style={{ color: repeat === "context" ? settings.primaryColor : settings.textColor }} />}
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
        <TbArrowsShuffle className="w-6" style={{ color: shuffle ? settings.primaryColor : settings.textColor }} onClick={() => invoke("change_shuffle_mode")} />
      </div>
      <div className="h-2 w-full relative">
        <div className="h-1 w-full rounded-full overflow-hidden absolute bottom-0" style={{ backgroundColor: settings.backgroundColor }}>
          <div className="h-full" style={{ backgroundColor: settings.textColor, width: `${(currentTime / duration) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default Controls;
