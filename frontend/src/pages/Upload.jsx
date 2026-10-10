import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { uploadDocument } from "../api/api";
import Loader from "../components/Loader";
import UploadBox from "../components/UploadBox";

function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const startedAt = useRef(null);

  useEffect(() => {
    if (!loading) return undefined;
    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [loading]);

  const handleUpload = async (file) => {
    setError("");
    startedAt.current = Date.now();
    setElapsedSeconds(0);
    setUploadProgress(0);
    setLoading(true);

    try {
      const record = await uploadDocument(file, setUploadProgress);
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
        <h1 className="font-display text-3xl font-semibold text-slate-950">Upload and summarize</h1>
        <p className="mt-2 text-slate-600">
          Your file is analyzed locally on this computer. Supports documents, audio, video, and images.
        </p>
      </section>

      <UploadBox onUpload={handleUpload} loading={loading} uploadProgress={uploadProgress} error={error} />

      {loading && (
        <Loader
          label={uploadProgress < 100 ? `Uploading file (${uploadProgress}%)...` : "File sent. Extracting content and summarizing locally..."}
          detail={uploadProgress < 100
            ? `Elapsed ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}.`
            : `Elapsed ${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}. Local CPU inference processes document sections serially, so longer files can take several minutes. Keep this page open; the result appears when processing finishes.`}
        />
      )}
    </div>
  );
}

export default Upload;
