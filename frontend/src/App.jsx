import { NavLink, Route, Routes } from "react-router-dom";

import History from "./pages/History";
import Home from "./pages/Home";
import Result from "./pages/Result";
import Upload from "./pages/Upload";

const links = [
  { to: "/", label: "Home" },
  { to: "/upload", label: "Upload" },
  { to: "/history", label: "History" },
];

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden">

      <header className="sticky top-0 z-20 border-b border-stone-200 bg-[#fbfaf7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <NavLink to="/" className="font-display text-lg font-bold tracking-tight text-slate-900">SmartSummarizer <span className="text-teal-700">AI</span></NavLink>
          <nav aria-label="Main navigation" className="flex flex-wrap gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                    ? "bg-teal-100 text-teal-900"
                      : "text-slate-600 hover:bg-stone-100 hover:text-slate-950"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 animate-rise">
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
