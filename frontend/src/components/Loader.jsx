function Loader({ label = "Processing..." }) {
  return (
    <section className="glass-panel flex flex-col items-center justify-center gap-4 p-10">
      <div className="loader-orbit" />
      <p className="text-sm text-slate-300">{label}</p>
    </section>
  );
}

export default Loader;
