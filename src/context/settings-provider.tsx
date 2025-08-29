import { useEffect, useMemo, useState } from "react";

import type { Settings } from "./settings-context";

import { SettingsContext, store } from "./settings-context";

const defaultSettings: Settings = {
  mode: "overlay",
  alignment: "vertical",
  backgroundColor: "#ffffff20",
  textColor: "#ffffff",
  primaryColor: "#05df72",
  borderRadius: 6,
  iconStyle: "outline",
  width: 200,
  height: 300,
  preferred_app: "spotify",
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      const storedSettings = await store.get("settings");
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...storedSettings });
      }
      else {
        setSettings(defaultSettings);
      }
    };

    loadSettings();

    let unsubscribe: (() => void) | undefined;

    store
      .onKeyChange<Settings>("settings", (newSettings: Settings | undefined) => {
        if (newSettings) {
          setSettings(newSettings as Settings);
        }
      })
      .then((unlisten) => {
        unsubscribe = unlisten;
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const contextValue = useMemo(() => ({ settings, setSettings }), [settings, setSettings]);
  return <SettingsContext value={contextValue}>{children}</SettingsContext>;
}
