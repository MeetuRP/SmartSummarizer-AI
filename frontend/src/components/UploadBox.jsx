import { useRef, useState } from "react";

const ACCEPTED_TYPES = ".txt,.pdf,.docx,.mp3,.wav,.mp4";

function UploadBox({ onUpload, loading, error }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const updateSelectedFile = (fileList) => {
    const file = fileList?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    updateSelectedFile(event.dataTransfer.files);
  };

  const handleUpload = () => {
    if (!selectedFile || loading) return;
    onUpload(selectedFile);
  };

  return (
    <section className="glass-panel p-6 md:p-8">
      <div
        role="button"
        tabIndex={0}
        onClick={pickFile}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") pickFile();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging
            ? "border-cyan-300 bg-cyan-400/10"
            : "border-cyan-300/40 bg-slate-900/60 hover:border-cyan-300 hover:bg-cyan-400/5"
        }`}
      >
        <p className="font-display text-xl font-medium text-cyan-100">
          Drag and drop your file here
        </p>
        <p className="mt-2 text-sm text-slate-300">or click to browse supported formats</p>
        <p className="mt-3 text-xs uppercase tracking-wider text-slate-400">
          TXT • PDF • DOCX • MP3 • WAV • MP4
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(event) => updateSelectedFile(event.target.files)}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-300">
          {selectedFile ? `Selected: ${selectedFile.name}` : "No file selected"}
        </p>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="rounded-lg bg-cyan-400 px-4 py-2 font-medium text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-cyan-300"
        >
          {loading ? "Processing..." : "Upload & Summarize"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </section>
  );
}

export default UploadBox;
