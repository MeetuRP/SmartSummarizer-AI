import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getSummary } from "../api/api";
import Loader from "../components/Loader";
import SummaryCard from "../components/SummaryCard";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();

  const stateRecord = location.state?.record || null;
  const summaryId = location.state?.id || "";

  const [record, setRecord] = useState(stateRecord);
  const [loading, setLoading] = useState(Boolean(summaryId && !stateRecord));
  const [error, setError] = useState("");

  useEffect(() => {
    if (stateRecord) {
      setRecord(stateRecord);
      return;
    }

    const saved = localStorage.getItem("latestSummary");
    if (saved) {
      try {
        setRecord(JSON.parse(saved));
      } catch {
        localStorage.removeItem("latestSummary");
      }
    }
  }, [stateRecord]);

  useEffect(() => {
    if (!summaryId || stateRecord) return;

    let active = true;

    const loadSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSummary(summaryId);
        if (active) {
          setRecord(data);
          localStorage.setItem("latestSummary", JSON.stringify(data));
        }
      } catch (err) {
        if (active) {
          const message = err?.response?.data?.detail || err?.message || "Could not load summary.";
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSummary();
    return () => {
      active = false;
    };
  }, [summaryId, stateRecord]);

  const createdAtText = useMemo(() => {
    if (!record?.created_at) return "";
    const date = new Date(record.created_at);
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  }, [record]);

  if (loading) {
    return <Loader label="Loading summary..." />;
  }

  if (error) {
    return (
      <div className="glass-panel p-6">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="glass-panel space-y-4 p-6">
        <h2 className="font-display text-2xl font-semibold text-cyan-100">No summary loaded</h2>
        <p className="text-slate-300">Upload a file first to generate a summary.</p>
        <button
          onClick={() => navigate("/upload")}
          className="rounded-lg bg-cyan-400 px-4 py-2 font-medium text-slate-950"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <h1 className="font-display text-3xl font-semibold text-cyan-100">Summary Result</h1>
        <p className="mt-2 text-slate-300">
          <span className="font-medium text-slate-200">File:</span> {record.file_name}
        </p>
        <p className="text-sm text-slate-400">
          {record.file_type?.toUpperCase()} {createdAtText ? `� ${createdAtText}` : ""}
        </p>
      </section>

      <SummaryCard record={record} />
    </div>
  );
}

export default Result;
