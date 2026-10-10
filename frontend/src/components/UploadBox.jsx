import { useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = ".txt,.pdf,.docx,.mp3,.wav,.mp4,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff";
const ACCEPTED_EXTENSIONS = new Set(ACCEPTED_TYPES.split(","));

function UploadBox({ onUpload, loading, uploadProgress = 0, error }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState("");
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    if (!selectedFile?.type.startsWith("image/")) {
      setPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const pickFile = () => inputRef.current?.click();

  const updateSelectedFile = (fileList) => {
    const file = fileList?.[0];
    if (file) {
      const extension = `.${file.name.split(".").pop()}`.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.has(extension) || file.size === 0) {
        setSelectedFile(null);
        setSelectionError(file.size === 0 ? "The selected file is empty." : "Choose a supported document, audio, video, or image file.");
        return;
      }
      setSelectedFile(file);
      setSelectionError("");
    }
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
            ? "border-teal-700 bg-teal-50"
            : "border-stone-300 bg-stone-50 hover:border-teal-700"
        }`}
      >
        <p className="font-display text-xl font-medium text-slate-900">
          Drag and drop your file here
        </p>
        <p className="mt-2 text-sm text-slate-600">or click to browse supported formats</p>
        <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">
          PDF • DOCX • TXT • MP3 • WAV • MP4 • PNG • JPG • WEBP • TIFF
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a document, audio, video, or image file"
          onChange={(event) => updateSelectedFile(event.target.files)}
        />
        {preview && <img src={preview} alt="Selected image preview" className="mx-auto mt-5 max-h-64 max-w-full rounded-xl object-contain" />}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="break-all text-sm text-slate-600">
          {selectedFile ? `Selected: ${selectedFile.name}` : "No file selected"}
        </p>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className="rounded-lg bg-teal-800 px-4 py-2 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-teal-900"
        >
          {loading ? (uploadProgress < 100 ? "Uploading..." : "Summarizing...") : "Upload & Summarize"}
        </button>
      </div>

      {(selectionError || error) && <p role="alert" className="mt-4 text-sm text-red-700">{selectionError || error}</p>}
    </section>
  );
}

export default UploadBox;
