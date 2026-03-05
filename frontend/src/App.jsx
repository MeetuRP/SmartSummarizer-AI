import { NavLink, Route, Routes } from "react-router-dom";

import History from "./pages/History";
import Home from "./pages/Home";
import Result from "./pages/Result";
import Upload from "./pages/Upload";

const links = [
  { to: "/", label: "Home" },
  { to: "/upload", label: "Upload" },
  { to: "/result", label: "Result" },
  { to: "/history", label: "History" },
];

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-noise" />

      <header className="sticky top-0 z-20 border-b border-cyan-200/20 bg-slate-950/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="font-display text-lg font-semibold tracking-wide text-cyan-300">
            SmartSummarizer AI
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-cyan-400/20 text-cyan-100"
                      : "text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-6 py-10 animate-rise">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/result" element={<Result />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
