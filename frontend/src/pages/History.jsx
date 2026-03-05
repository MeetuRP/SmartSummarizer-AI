import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getHistory, getSummary } from "../api/api";
import Loader from "../components/Loader";

function getItemId(item) {
  return item?.id || item?._id || "";
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
          const message = err?.response?.data?.detail || err?.message || "Could not load history.";
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
      const message = err?.response?.data?.detail || err?.message || "Could not open summary.";
      setError(message);
    }
  };

  if (loading) {
    return <Loader label="Fetching summary history..." />;
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <h1 className="font-display text-3xl font-semibold text-cyan-100">Summary History</h1>
        <p className="mt-2 text-slate-300">Browse previous generated summaries.</p>
      </section>

      {error && (
        <section className="glass-panel border-red-300/40 p-4 text-red-300">{error}</section>
      )}

      {items.length === 0 ? (
        <section className="glass-panel p-6 text-slate-300">No summaries found yet.</section>
      ) : (
        <section className="grid gap-4">
          {items.map((item) => {
            const itemId = getItemId(item);

            return (
              <article key={itemId || `${item.file_name}-${item.created_at}`} className="glass-panel p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <h2 className="font-display text-lg font-semibold text-cyan-100">{item.file_name}</h2>
                    <p className="text-sm text-slate-400">
                      {item.file_type?.toUpperCase()} - {new Date(item.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-300">
                      {item.summary.length > 180 ? `${item.summary.slice(0, 180)}...` : item.summary}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpen(itemId)}
                    className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
                  >
                    Open Summary
                  </button>
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
