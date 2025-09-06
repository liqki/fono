import { invoke } from "@tauri-apps/api/core";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { relaunch } from "@tauri-apps/plugin-process";
import { useEffect, useState } from "react";
import { FaSave } from "react-icons/fa";
import { FaCircleInfo } from "react-icons/fa6";

import { store, useSettings } from "../context/settings-context";
import Input from "./input";
import Select from "./select";
import Titlebar from "./title-bar";
import Toggle from "./toggle";

function Settings() {
  const { settings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);

  useEffect(() => {
    const fetchAutoStart = async () => {
      setAutoStartEnabled(await isEnabled());
    };

    fetchAutoStart();
  }, [settings]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setLocalSettings(settings);
  }, [settings]);

  const handleAutoStartToggle = async (enabled: boolean) => {
    setAutoStartEnabled(enabled);
    if (enabled) {
      await enable();
      return;
    }
    await disable();
  };

  const handleSave = async () => {
    await store.set("settings", localSettings);
    await store.save();
    await invoke("update_settings", { mode: localSettings.mode, width: localSettings.width, height: localSettings.height });
    if (settings.preferred_app !== localSettings.preferred_app) {
      await relaunch();
    }
  };

  const appSettings: SettingProps[] = [{
    label: "Mode",
    description: "Determines if the widget is display above or below all other apps.",
    value: localSettings.mode,
    setValue: value => setLocalSettings(prev => ({ ...prev, mode: value as "overlay" | "widget" })),
    type: "select",
    options: ["Overlay", "Widget"],
  }, {
    label: "Alignment",
    description: "Determines if the widget is displayed horizontally or vertically.",
    value: localSettings.alignment,
    setValue: value => setLocalSettings(prev => ({ ...prev, alignment: value as "horizontal" | "vertical" })),
    type: "select",
    options: ["Horizontal", "Vertical"],
  }, {
    label: "Background Color",
    description: "The background color of the widget. The opacity can be specified after the hex code (f.e. #FFFFFF20).",
    value: localSettings.backgroundColor,
    setValue: value => setLocalSettings(prev => ({ ...prev, backgroundColor: String(value) })),
    type: "text",
  }, {
    label: "Text Color",
    description: "The text color used for the widget.",
    value: localSettings.textColor,
    setValue: value => setLocalSettings(prev => ({ ...prev, textColor: String(value) })),
    type: "text",
  }, {
    label: "Primary Color",
    description: "The color used for the repeat mode and shuffle icons.",
    value: localSettings.primaryColor,
    setValue: value => setLocalSettings(prev => ({ ...prev, primaryColor: String(value) })),
    type: "text",
  }, {
    label: "Border Radius",
    description: "The border radius of the widget.",
    value: localSettings.borderRadius,
    setValue: value => setLocalSettings(prev => ({ ...prev, borderRadius: Number(value) })),
    type: "number",
  }, {
    label: "Width",
    description: "The width of the widget.",
    value: localSettings.width,
    setValue: value => setLocalSettings(prev => ({ ...prev, width: Number(value) })),
    type: "number",
  }, {
    label: "Height",
    description: "The height of the widget.",
    value: localSettings.height,
    setValue: value => setLocalSettings(prev => ({ ...prev, height: Number(value) })),
    type: "number",
  }, {
    label: "Icon Style",
    description: "The style of the icons displayed in the widget. None means no icons will be displayed.",
    value: localSettings.iconStyle,
    setValue: value => setLocalSettings(prev => ({ ...prev, iconStyle: value as "filled" | "outline" | "none" })),
    type: "select",
    options: ["Filled", "Outline", "None"],
  }, {
    label: "Preferred App",
    description: "The app to prioritize if there is more than one media session. Check the repository for more information. This setting requires a restart to take effect.",
    value: localSettings.preferred_app,
    setValue: value => setLocalSettings(prev => ({ ...prev, preferred_app: String(value) })),
    type: "text",
  }];

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Titlebar />
      <main className="w-full h-[calc(100%-32px)] overflow-hidden bg-gray-900 rounded-b-sm text-white box-border p-4 flex flex-col gap-4 mt-8">
        <div className="flex w-full justify-between items-center">
          <h1 className="text-xl font-semibold">Settings</h1>
          <button type="button" className="flex items-center gap-2 group" onClick={handleSave}>
            <p className="hidden group-hover:block bg-gray-900 px-2 rounded-md text-sm">
              Save Changes
              {settings.preferred_app !== localSettings.preferred_app
                ? (
                    <>
                      .
                      {" "}
                      <span className="text-red-500">The app will restart</span>
                    </>
                  )
                : ""}
            </p>
            <FaSave className="text-xl text-gray-400 hover:scale-[1.1] transition-transform hover:text-white" />
          </button>
        </div>
        <div className="overflow-y-scroll scrollbar-thumb-gray-400 scrollbar-track-gray-900 scrollbar-thin h-full flex flex-col gap-4 px-2 pb-2">
          {appSettings.map(setting => (
            <Setting key={setting.label} label={setting.label} description={setting.description} value={setting.value} setValue={setting.setValue} type={setting.type} options={setting.options} />
          ))}
          <Toggle
            label="Lock Widget"
            description="Enable this to prevent the widget from being moved."
            value={localSettings.lockWidget}
            onChange={value => setLocalSettings(prev => ({ ...prev, lockWidget: value }))}
          />
          <Toggle
            label="Start on Boot"
            description="Enable this to start the app on system boot."
            value={autoStartEnabled}
            onChange={handleAutoStartToggle}
          />
        </div>
      </main>
    </div>
  );
}

export default Settings;

type SettingProps = {
  label: string;
  description: string;
  value: string | number;
  setValue: (value: string | number) => void;
  type: "text" | "number" | "select";
  options?: string[];
};

function Setting({ label, description, value, setValue, type, options }: SettingProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label htmlFor={label}>
          {label}
        </label>
        <div className="relative group">
          <FaCircleInfo className="text-gray-400 hover:text-white" />
          <div className="w-[500px] hidden group-hover:block absolute -bottom-2 left-5 bg-gray-900 p-2 rounded-md text-sm text-white">{description}</div>
        </div>
      </div>
      {type === "select" && options
        ? <Select label={label} value={String(value)} setValue={setValue} options={options} />
        : <Input label={label} value={value} setValue={setValue} type={type as "text" | "number"} />}
    </div>
  );
}
