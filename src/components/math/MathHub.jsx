import { ArrowLeft, ArrowRight, BookOpen, Calculator, ClipboardCheck, Gamepad2, Minus, Plus, Sparkles, Star, X, Bug, Shield } from "lucide-react";
import { useEffect, useState } from "react";

const MATH_OPERATIONS = [
  { id: "tambah", title: "Operasi tambah", english: "Addition", symbol: "+", helper: "Gabung nombor", color: "coral", Icon: Plus, learningHref: "/addition-regroup" },
  { id: "tolak", title: "Operasi tolak", english: "Subtraction", symbol: "−", helper: "Ambil dan kira", color: "mint", Icon: Minus, learningHref: "/minus-regroup" },
  { id: "darab", title: "Operasi darab", english: "Multiplication", symbol: "×", helper: "Kumpulan sama banyak", color: "lemon", Icon: Star },
  { id: "bahagi", title: "Operasi bahagi", english: "Division", symbol: "÷", helper: "Kongsi sama rata", color: "blue", Icon: Calculator }
];

export default function MathHub({ onBack, onComingSoon, notice }) {
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [choiceStep, setChoiceStep] = useState("mode");
  const closeChoice = () => {
    setSelectedOperation(null);
    setChoiceStep("mode");
  };
  useEffect(() => {
    if (!selectedOperation) return undefined;
    const handleEscape = (event) => { if (event.key === "Escape") closeChoice(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedOperation]);
  const openLearning = () => {
    if (!selectedOperation?.learningHref) return;
    window.location.href = selectedOperation.learningHref;
  };
  const openPlayChoices = () => setChoiceStep("games");
  const openGame = (game) => {
    const operation = selectedOperation?.id;
    if (!operation) return;
    window.location.href = game === "zombie"
      ? `/zombie-defense?op=${operation}`
      : `/mosquito-splat?op=${operation}&game=mosquito`;
  };
  const openAssessment = () => {
    const operation = selectedOperation?.id;
    if (operation) window.location.href = `/zombie-defense?op=${operation}&assessment=1`;
  };

  return (
    <div className="home-content hub-content math-hub-content">
      <div className="hub-hero math-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih subjek"><ArrowLeft size={18} /> <span>Subjek</span></button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Calculator size={15} /> Matematik <span>/ Mathematics</span></span>
          <h1>Kira, cuba, tepuk tangan!</h1>
          <p>Choose an operation and make numbers your playground.</p>
        </div>
        <div className="math-hero-equation" aria-hidden="true"><span>3</span><b>+</b><span>2</span><b>=</b><strong>5</strong></div>
      </div>

      <section className="hub-section operation-section" aria-labelledby="operation-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">01 / Nombor</span><h2 id="operation-title">Pilih operasi</h2><p>Pick a maths move to practise next.</p></div>
          <span className="skill-count"><Calculator size={15} /> 4 ruang latihan</span>
        </div>
        <div className="operation-grid">
          {MATH_OPERATIONS.map(({ id, title, english, symbol, helper, color, Icon, learningHref }) => {
            const content = <>
              <span className="operation-card-icon"><Icon size={23} strokeWidth={2.8} /></span>
              <span className="operation-symbol" aria-hidden="true">{symbol}</span>
              <span className="operation-copy"><strong>{title}</strong><span>{english}</span><em>{helper}</em></span>
              <span className="operation-status">Pilih cara <ArrowRight size={14} /></span>
            </>;
            return <button className={`operation-card operation-card-${color} is-live`} type="button" key={id} onClick={() => { setSelectedOperation({ id, title, symbol, learningHref }); setChoiceStep("mode"); }} aria-label={`Pilih cara untuk ${title}`}>{content}</button>;
          })}
        </div>
      </section>

      <section className="math-practice-strip" aria-label="Contoh ruang matematik">
        <div className="math-strip-icon"><Calculator size={26} /></div>
        <div><span className="section-kicker">Ruang kira-kira</span><strong>Setiap jawapan betul jadi satu bintang.</strong></div>
        <div className="star-row" aria-hidden="true"><Star size={22} fill="currentColor" /><Star size={22} fill="currentColor" /><Star size={22} fill="currentColor" /><Star size={22} /></div>
      </section>

      <section className="math-game-strip" aria-label="Permainan matematik">
        <span className="math-game-icon"><Sparkles size={26} /></span>
        <div className="math-game-copy"><span className="section-kicker">Permainan laju</span><strong>Hempaplah Nyamuk!</strong><em>Tambah, tolak, darab dan bahagi dalam 60 saat.</em></div>
        <a className="math-game-link" href="/mosquito-splat">Main <ArrowRight size={15} /></a>
      </section>
      {notice && <div className="home-notice" role="status"><Sparkles size={17} /> <span>{notice}</span></div>}
      {selectedOperation && (
        <div className="syllable-choice-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeChoice(); }}>
          <section className="syllable-choice-dialog math-game-choice-dialog" role="dialog" aria-modal="true" aria-labelledby={choiceStep === "mode" ? "math-mode-choice-title" : "math-game-choice-title"}>
            <button className="icon-close-button" type="button" onClick={closeChoice} aria-label="Tutup pilihan permainan"><X size={18} /></button>
            <span className="section-kicker">{selectedOperation.symbol} {selectedOperation.title}</span>
            {choiceStep === "mode" ? (
              <>
                <h2 id="math-mode-choice-title">Pilih Belajar atau Bermain</h2>
                <p>Pilih cara untuk latihan operasi ini.</p>
                <div className="math-game-choice-grid math-mode-choice-grid">
                  <button type="button" className="math-game-choice math-game-choice-learn" onClick={openLearning} disabled={!selectedOperation.learningHref}><span><BookOpen size={25} /></span><strong>Belajar</strong><small>{selectedOperation.learningHref ? "Latihan langkah demi langkah." : "Modul belajar untuk operasi ini akan datang."}</small>{selectedOperation.learningHref ? <ArrowRight size={17} /> : <span className="math-choice-badge">Akan datang</span>}</button>
                  <button type="button" className="math-game-choice math-game-choice-assessment" onClick={openAssessment}><span><ClipboardCheck size={25} /></span><strong>Ujian</strong><small>15 soalan. Lulus apabila semua jawapan betul.</small><ArrowRight size={17} /></button>
                  <button type="button" className="math-game-choice math-game-choice-play" onClick={openPlayChoices}><span><Gamepad2 size={25} /></span><strong>Bermain</strong><small>Pilih Hempaplah Nyamuk atau Zombie Defense.</small><ArrowRight size={17} /></button>
                </div>
              </>
            ) : (
              <>
                <button type="button" className="math-choice-back" onClick={() => setChoiceStep("mode")}><ArrowLeft size={16} /> Belajar atau Bermain</button>
                <h2 id="math-game-choice-title">Pilih permainan</h2>
                <p>Pilih permainan untuk latihan operasi ini.</p>
                <div className="math-game-choice-grid">
                  <button type="button" className="math-game-choice math-game-choice-mosquito" onClick={() => openGame("mosquito")}><span><Bug size={25} /></span><strong>Hempaplah Nyamuk</strong><small>Kira dan hempap jawapan yang betul.</small><ArrowRight size={17} /></button>
                  <button type="button" className="math-game-choice math-game-choice-zombie" onClick={() => openGame("zombie")}><span><Shield size={25} /></span><strong>Zombie Defense</strong><small>Serang zombie sambil lindungi otak.</small><ArrowRight size={17} /></button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
