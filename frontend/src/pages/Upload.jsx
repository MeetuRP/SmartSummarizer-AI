import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { uploadDocument } from "../api/api";
import Loader from "../components/Loader";
import UploadBox from "../components/UploadBox";

function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file) => {
    setError("");
    setLoading(true);

    try {
      const record = await uploadDocument(file);
      localStorage.setItem("latestSummary", JSON.stringify(record));
      navigate("/result", { state: { record } });
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || "Upload failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 md:p-8">
        <h1 className="font-display text-3xl font-semibold text-cyan-100">Upload and Summarize</h1>
        <p className="mt-2 text-slate-300">
          Drag and drop your file, then let the AI pipeline extract and summarize it.
        </p>
      </section>

      <UploadBox onUpload={handleUpload} loading={loading} error={error} />

      {loading && <Loader label="Extracting content and generating your summary..." />}
    </div>
  );
}

export default Upload;
