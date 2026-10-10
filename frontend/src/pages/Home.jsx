import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Multi-format Ingestion",
    description: "Summarize PDFs, Word files, notes, audio, video, charts, scans, and images.",
  },
  {
    title: "Structured AI Output",
    description: "Get summaries formatted into key points, important details, and final takeaway.",
  },
  {
    title: "History + Revisit",
    description: "Runs on your computer with a local model. Your source content stays on your machine.",
  },
];

function Home() {
  return (
    <div className="space-y-10">
      <section className="glass-panel relative overflow-hidden p-8 md:p-14">

        <div className="relative max-w-3xl space-y-6">
          <p className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
            Private by design · Local AI
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-slate-950 md:text-6xl">
            Make sense of the files that fill your day.
          </h1>
          <p className="text-lg text-slate-600">
            Turn documents, recordings, and images into clear, structured notes. Summaries run on your computer with a local model.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/upload"
              className="rounded-xl bg-teal-800 px-5 py-3 font-medium text-white transition hover:bg-teal-900"
            >
              Start Upload
            </Link>
            <Link
              to="/history"
              className="rounded-xl border border-stone-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-stone-50"
            >
              View History
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="glass-panel p-6">
            <h2 className="font-display text-lg font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Home;
