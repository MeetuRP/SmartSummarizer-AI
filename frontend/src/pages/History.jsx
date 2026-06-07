import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getHistory, getSummary } from "../api/api";
import Loader from "../components/Loader";

function getItemId(item) {
  return item?.id || item?._id || "";
}

function cleanSummaryPreview(text) {
  if (!text) return "";

  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/Here is a structured summary of the document:/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getHistory();
        if (active) setItems(data);
      } catch (err) {
        if (active) {
          const message =
            err?.response?.data?.detail ||
            err?.message ||
            "Could not load history.";

          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  const handleOpen = async (id) => {
    if (!id) {
      setError("This summary record is missing a valid id.");
      return;
    }

    try {
      const record = await getSummary(id);
      localStorage.setItem("latestSummary", JSON.stringify(record));
      navigate("/result", { state: { record } });
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Could not open summary.";

      setError(message);
    }
  };

  if (loading) {
    return <Loader label="Fetching summary history..." />;
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <h1 className="font-display text-3xl font-semibold text-cyan-100">
          Summary History
        </h1>

        <p className="mt-2 text-slate-300">
          Browse previous generated summaries.
        </p>
      </section>

      {error && (
        <section className="glass-panel border border-red-400/30 p-4 text-red-300">
          {error}
        </section>
      )}

      {items.length === 0 ? (
        <section className="glass-panel p-6 text-slate-300">
          No summaries found yet.
        </section>
      ) : (
        <section className="grid gap-5">
          {items.map((item) => {
            const itemId = getItemId(item);

            return (
              <article
                key={itemId || `${item.file_name}-${item.created_at}`}
                className="glass-panel p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-4">
                    <h2 className="font-display text-xl font-semibold text-cyan-100 break-words">
                      {item.file_name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
                        {item.file_type?.toUpperCase()}
                      </span>

                      {/* <span>•</span>

                      <span>
                        {new Date(item.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </span> */}
                    </div>

                    <div className="rounded-2xl border border-slate-700/40 bg-slate-950/50 p-4">
                      <p className="text-sm leading-7 text-slate-300">
                        {cleanSummaryPreview(item.summary).length > 250
                          ? `${cleanSummaryPreview(item.summary).slice(0, 250)}...`
                          : cleanSummaryPreview(item.summary)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() => handleOpen(itemId)}
                      className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-105 hover:bg-cyan-300"
                    >
                      Open Summary
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default History;