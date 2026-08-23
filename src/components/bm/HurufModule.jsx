function HurufModule({ onBack }) {
  const [selectedLetter, setSelectedLetter] = useState(HURUF[0]);
  const [letterCase, setLetterCase] = useState("capital");

  return (
    <div className="home-content hub-content letter-learning-content">
      <div className="hub-hero letter-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih ruang Bahasa Melayu">
          <ArrowLeft size={18} /> <span>Bahasa Melayu</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><PenLine size={15} /> Huruf <span>/ Letters</span></span>
          <h1>Kenal dan bunyi!</h1>
          <p>Choose a letter and press it to hear the sound.</p>
        </div>
        <div className="letter-hero-badge"><span>A</span><strong>26 huruf</strong></div>
      </div>

      <section className="letter-learning-section" aria-labelledby="letter-learning-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="letter-learning-title">Huruf hari ini</h2><p>Pilih huruf besar atau huruf kecil, kemudian tekan untuk dengar.</p></div>
          <span className="skill-count">Comic handwriting</span>
        </div>
        <div className="case-toggle" role="tablist" aria-label="Tukar huruf besar atau kecil">
          <button className={letterCase === "capital" ? "is-selected" : ""} type="button" role="tab" aria-selected={letterCase === "capital"} onClick={() => setLetterCase("capital")}><strong>A</strong><span>Huruf besar</span></button>
          <button className={letterCase === "small" ? "is-selected" : ""} type="button" role="tab" aria-selected={letterCase === "small"} onClick={() => setLetterCase("small")}><strong>a</strong><span>Huruf kecil</span></button>
        </div>
        <div className="letter-learning-grid letter-learning-grid-single">
          <LetterRecognitionPanel selectedLetter={selectedLetter} onSelect={setSelectedLetter} letterCase={letterCase} />
        </div>
      </section>

      <Suspense fallback={<div className="letter-case-game-loading" role="status">Menyediakan permainan huruf...</div>}>
        <LetterCaseGame letters={HURUF} onPlayLetter={playLetterAudio} />
      </Suspense>

      <section className="letter-test-section" aria-labelledby="letter-test-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Test / Uji diri</span><h2 id="letter-test-title">Cuba sendiri</h2><p>Two small challenges to show what you know.</p></div>
          <span className="skill-count"><CheckCircle2 size={15} /> 2 aktiviti</span>
        </div>
        <div className="letter-test-grid">
          <LetterMatchTest />
          <LetterSoundTest letter={selectedLetter} letterCase={letterCase} />
        </div>
      </section>
    </div>
  );
}

