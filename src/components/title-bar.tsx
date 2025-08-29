import { getCurrentWindow } from "@tauri-apps/api/window";
import { FaGithub } from "react-icons/fa6";
import { MdClose, MdMinimize } from "react-icons/md";

const appWindow = getCurrentWindow();

function Titlebar() {
  return (
    <div className="w-screen h-8 fixed top-0 flex items-center justify-between box-border overflow-hidden bg-gray-900 text-white select-none rounded-t-sm" data-tauri-drag-region>
      <div className="w-20 flex">
        <a href="https://github.com/liqki/fono" className="ml-2" target="_blank" rel="noreferrer">
          <FaGithub />
        </a>
      </div>
      <p data-tauri-drag-region>fono</p>
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
