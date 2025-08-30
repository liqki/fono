import { HashRouter, Route, Routes } from "react-router";

import NowPlaying from "./components/fono-widget";
import Settings from "./components/settings";
import "./globals.css";

function App() {
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
