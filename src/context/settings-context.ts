import { LazyStore } from "@tauri-apps/plugin-store";
import { createContext, use } from "react";

export type Settings = {
  mode: "overlay" | "widget";
  alignment: "horizontal" | "vertical";
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  borderRadius: number;
  iconStyle: "filled" | "outline" | "none";
  width: number;
  height: number;
  preferred_app: string;
  lockWidget: boolean;
};

type SettingsContextType = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
};

export const store = new LazyStore("settings.json");

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = use(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
