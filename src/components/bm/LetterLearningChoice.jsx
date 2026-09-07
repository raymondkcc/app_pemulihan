import { useEffect, useRef } from "react";
import { BookOpen, PenLine, X } from "lucide-react";

export default function LetterLearningChoice({ onBack, onChoose }) {
  const firstChoiceRef = useRef(null);

  useEffect(() => {
    firstChoiceRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onBack();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  return (
    <div className="syllable-choice-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onBack()}>
      <section className="syllable-choice-dialog letter-learning-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="letter-learning-choice-title">
        <div className="syllable-choice-dialog-topline">
          <span className="hub-eyebrow"><BookOpen size={15} /> Huruf / Belajar</span>
          <button className="icon-close-button" type="button" onClick={onBack} aria-label="Tutup pilihan belajar" title="Tutup"><X size={18} /></button>
        </div>
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar</span><h2 id="letter-learning-choice-title">Mahu belajar apa?</h2><p>Pilih baca atau tulis.</p></div>
        </div>
        <div className="letter-learning-choice-grid">
          <button ref={firstChoiceRef} className="letter-learning-choice-card letter-learning-choice-read" type="button" onClick={() => onChoose("baca")}>
            <BookOpen size={34} />
            <strong>Belajar baca</strong>
            <span>Kenal bentuk dan bunyi huruf</span>
          </button>
          <button className="letter-learning-choice-card letter-learning-choice-write" type="button" onClick={() => onChoose("tulis")}>
            <PenLine size={34} />
            <strong>Belajar tulis</strong>
            <span>Ikut laluan dan tulis huruf</span>
          </button>
        </div>
      </section>
    </div>
  );
}
