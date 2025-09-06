import { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router";

import NowPlaying from "./components/fono-widget";
import "./globals.css";
import Settings from "./components/settings";
import { checkForUpdates } from "./util/updater";

function App() {
  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/fono" element={<NowPlaying />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
