import { useEffect } from "react";
import { BookOpen, Volume2, X } from "lucide-react";

export default function SyllableLearningChoice({ onBack, onChoose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onBack();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  return (
    <div className="syllable-choice-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onBack()}>
      <section className="syllable-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="syllable-choice-title">
        <div className="syllable-choice-dialog-topline">
          <span className="hub-eyebrow"><BookOpen size={15} /> Suku kata / Belajar</span>
          <button className="icon-close-button" type="button" onClick={onBack} aria-label="Tutup pilihan belajar" title="Tutup"><X size={18} /></button>
        </div>
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar</span><h2 id="syllable-choice-title">Pilih jenis suku kata</h2><p>Pilih ruang yang mahu dibuka.</p></div>
          <span className="skill-count"><Volume2 size={15} /> Dengar dan baca</span>
        </div>
        <div className="syllable-choice-grid">
          <button className="syllable-choice-card syllable-choice-kv" type="button" onClick={() => onChoose("kv")}>
            <span className="syllable-choice-pattern">ba · be · bi</span>
            <strong>KV</strong>
            <span>Konsonan + vokal</span>
            <em>Buka jadual bunyi</em>
          </button>
          <button className="syllable-choice-card syllable-choice-kvk" type="button" onClick={() => onChoose("kvk")}>
            <span className="syllable-choice-pattern">bas · bek · tin</span>
            <strong>KVK</strong>
            <span>Konsonan + vokal + konsonan</span>
            <em>Buka Pintu KVK</em>
          </button>
        </div>
      </section>
    </div>
  );
}
