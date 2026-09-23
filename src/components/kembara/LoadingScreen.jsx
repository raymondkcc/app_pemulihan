import { Sparkles } from "lucide-react";

export default function LoadingScreen({ variant = "portal" }) {
  return (
    <main className={`app-loading-page app-loading-${variant}`} aria-label="Memuatkan ruang belajar">
      <section className="app-loading-card">
        <div className="app-loading-orbit" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="app-loading-logo" aria-hidden="true"><span>A</span><span>1</span><span>*</span></div>
        <div className="app-loading-copy"><strong>Kembara Pintar</strong><span><Sparkles size={14} /> Jom mula<span className="app-loading-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span></div>
      </section>
    </main>
  );
}
