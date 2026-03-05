import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Multi-format Ingestion",
    description: "Upload PDF, DOCX, TXT, MP3, WAV, and MP4 files in one flow.",
  },
  {
    title: "Structured AI Output",
    description: "Get summaries formatted into key points, important details, and final takeaway.",
  },
  {
    title: "History + Revisit",
    description: "Every generated summary is stored and accessible from your history page.",
  },
];

function Home() {
  return (
    <div className="space-y-10">
      <section className="glass-panel relative overflow-hidden p-8 md:p-12">
        <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-56 w-56 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative max-w-3xl space-y-6">
          <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
            AI Document Intelligence
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            Transform long documents into actionable summaries in seconds.
          </h1>
          <p className="text-lg text-slate-300">
            SmartSummarizer AI extracts text from documents, audio, and video, then generates structured summaries with Groq.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/upload"
              className="rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300"
            >
              Start Upload
            </Link>
            <Link
              to="/history"
              className="rounded-xl border border-cyan-300/40 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-400/10"
            >
              View History
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="glass-panel p-6">
            <h2 className="font-display text-lg font-semibold text-cyan-100">{item.title}</h2>
            <p className="mt-3 text-sm text-slate-300">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Home;
