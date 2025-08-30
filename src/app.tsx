import { HashRouter, Route, Routes } from "react-router";

import NowPlaying from "./components/fono-widget";
import Settings from "./components/settings";
import "./globals.css";

function App() {
  // TODO: Fix window state not saving on unexpected close
  // TODO: Add update check
  // TODO: Add song links to thumbnail and title
  // TODO: Add icon

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
