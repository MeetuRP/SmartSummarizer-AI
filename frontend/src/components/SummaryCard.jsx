import { useState } from "react";

function SummaryCard({ record }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(record.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const safeName = (record.file_name || "summary").replace(/\.[^.]+$/, "");
    const content = [
      `File Name: ${record.file_name}`,
      `File Type: ${record.file_type}`,
      `Created At: ${new Date(record.created_at).toLocaleString()}`,
      "",
      "Summary",
      "=======",
      record.summary,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="glass-panel overflow-hidden p-6 md:p-8">
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-50"
        >
          {copied ? "Copied" : "Copy Summary"}
        </button>
        <button
          onClick={handleDownload}
          className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-900"
        >
          Download Summary
        </button>
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <pre className="whitespace-pre-wrap break-words font-body text-sm leading-relaxed text-slate-700">
          {record.summary}
        </pre>
      </div>
    </section>
  );
}

export default SummaryCard;
