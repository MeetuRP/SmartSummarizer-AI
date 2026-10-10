function Loader({ label = "Processing...", detail }) {
  return (
    <section className="glass-panel flex flex-col items-center justify-center gap-4 p-10">
      <div className="loader-orbit" />
      <p role="status" className="text-sm text-slate-600">{label}</p>
      {detail && <p className="max-w-xl text-center text-xs text-slate-500" aria-live="polite">{detail}</p>}
    </section>
  );
}

export default Loader;
