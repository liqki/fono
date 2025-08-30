import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { MdClose, MdMinimize } from "react-icons/md";

import fonoIcon from "../assets/icon.png";

const appWindow = getCurrentWindow();

function Titlebar() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    const fetchVersion = async () => {
      const appVersion = await getVersion();
      setVersion(appVersion);
    };

    fetchVersion();
  }, []);

  return (
    <div className="w-screen h-8 fixed top-0 flex items-center justify-between box-border overflow-hidden bg-gray-900 text-white select-none rounded-t-sm" data-tauri-drag-region>
      <div className="w-20 flex">
        <a href="https://github.com/liqki/fono" className="ml-2" target="_blank" rel="noreferrer">
          <img src={fonoIcon} alt="Fono Icon" className="h-6 rounded-md" />
        </a>
      </div>
      <p data-tauri-drag-region>
        fono - v
        {version}
      </p>
      <div className="h-8 w-20 flex">
        <button type="button" className="h-full hover:bg-white/10 flex-1 text-xl grid place-items-center" onClick={() => appWindow.minimize()}>
          <MdMinimize />
        </button>
        <button type="button" className="h-full hover:bg-red-600 flex-1 text-xl grid place-items-center" onClick={() => appWindow.close()}>
          <MdClose />
        </button>
      </div>
    </div>
  );
}

export default Titlebar;
