function BMLearningPicker({ onBack, onChoose }) {
  return (
    <div className="home-content hub-content bm-picker-content">
      <div className="hub-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih subjek">
          <ArrowLeft size={18} /> <span>Subjek</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><BookOpen size={15} /> Bahasa Melayu <span>/ Malay</span></span>
          <h1>Apa mahu belajar?</h1>
          <p>Choose a learning path before we start the game.</p>
        </div>
        <div className="hub-hero-badge"><Star size={18} fill="currentColor" /><span><strong>5</strong> pilihan belajar</span></div>
      </div>

      <section className="bm-module-section" aria-labelledby="bm-module-title">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Bahasa Melayu / Malay</span>
            <h2 id="bm-module-title">Pilih satu ruang</h2>
            <p>Start with the skill you want to practise today.</p>
          </div>
          <span className="skill-count"><Sparkles size={15} /> Jom belajar</span>
        </div>
        <div className="bm-module-grid">
          {BM_MODULES.map(({ id, title, english, description, sample, color, Icon }) => (
            <button className={`bm-module-card bm-module-card-${color}`} type="button" key={id} onClick={() => onChoose(id)}>
              <span className="bm-module-icon"><Icon size={24} strokeWidth={2.5} /></span>
              <span className="bm-module-sample">{sample}</span>
              <span className="bm-module-copy"><strong>{title}</strong><span>{english}</span><em>{description}</em></span>
              <span className="bm-module-action">Buka ruang <ChevronRight size={17} /></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function LetterRecognitionPanel({ selectedLetter, onSelect, letterCase }) {
  const [speakingLetter, setSpeakingLetter] = useState(null);
  const soundTimer = useRef(null);

  useEffect(() => {
    const removeVoiceListener = warmSpeechEngine();
    preloadLetterAudio();
    return () => {
      removeVoiceListener();
      window.clearTimeout(soundTimer.current);
    };
  }, []);

  function chooseLetter(item) {
    onSelect(item);
    setSpeakingLetter(item.letter);
    window.clearTimeout(soundTimer.current);
    soundTimer.current = window.setTimeout(() => setSpeakingLetter(null), 900);
    playLetterAudio(item);
  }

  const selectedGlyph = letterCase === "capital" ? selectedLetter.letter : selectedLetter.letter.toLowerCase();

  return (
    <div className="letter-panel letter-recognition-panel">
      <div className="letter-panel-heading">
        <span className="section-kicker">Aktiviti 01 / Kenal</span>
        <h3>Kenal huruf</h3>
        <p>Tekan satu huruf untuk dengar bunyinya.</p>
      </div>
      <div className="letter-choice-row" aria-label="Pilih huruf untuk belajar">
        {HURUF.map((item, index) => {
          const glyph = letterCase === "capital" ? item.letter : item.letter.toLowerCase();
          return (
            <button className={`letter-choice ${selectedLetter.letter === item.letter ? "is-selected" : ""} ${speakingLetter === item.letter ? "is-speaking" : ""}`} style={{ "--letter-index": index }} type="button" key={item.letter} onClick={() => chooseLetter(item)} aria-pressed={selectedLetter.letter === item.letter} aria-label={`Dengar bunyi huruf ${glyph}`} title={`Dengar ${glyph}`}>
              <strong>{glyph}</strong>
              <span className="letter-button-ripple" aria-hidden="true"><i /><i /><i /></span>
            </button>
          );
        })}
      </div>
      <div className="letter-selected-card" role="status" aria-live="polite">
        <span>Huruf dipilih</span>
        <strong>{selectedGlyph}</strong>
        <em>{speakingLetter ? "Sedang sebut..." : "Tekan huruf untuk dengar"}</em>
      </div>
    </div>
  );
}

function LearningTiles({ type = "book" }) {
  if (type === "math") {
    return (
      <div className="learning-visual learning-visual-math" aria-hidden="true">
        <div className="math-scribble">+</div>
        <div className="math-card math-card-top"><span>2</span><span>+ 3</span></div>
        <div className="math-card math-card-bottom"><span>5</span><CheckCircle2 size={20} /></div>
        <span className="visual-star star-one"><Star size={18} fill="currentColor" /></span>
        <span className="visual-star star-two"><Sparkles size={17} fill="currentColor" /></span>
      </div>
    );
  }

  return (
    <div className="learning-visual learning-visual-book" aria-hidden="true">
      <div className="book-shape"><BookOpen size={62} strokeWidth={1.7} /></div>
      <span className="letter-tile tile-a">A</span>
      <span className="letter-tile tile-ba">BA</span>
      <span className="letter-tile tile-bu">BU</span>
      <span className="visual-star star-one"><Star size={17} fill="currentColor" /></span>
      <span className="visual-star star-two"><Sparkles size={18} fill="currentColor" /></span>
    </div>
  );
}

function SubjectCard({ title, english, description, type, color, onClick }) {
  return (
    <button className={`subject-card subject-card-${color}`} type="button" onClick={onClick}>
      <span className="subject-card-topline">
        <span className="subject-card-label"><Languages size={15} /> {english}</span>
        <ArrowRight size={21} aria-hidden="true" />
      </span>
      <LearningTiles type={type} />
      <span className="subject-card-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="subject-card-action">Pilih subjek <ChevronRight size={16} /></span>
    </button>
  );
}

function SyllableCard({ family, onComingSoon }) {
  const content = (
    <>
      <span className="syllable-card-topline">
        <span className="syllable-status">{family.live ? "Boleh mula" : "Akan datang"}</span>
        {family.live ? <ArrowRight size={19} /> : <LockKeyhole size={17} />}
      </span>
      <span className="syllable-pattern" aria-hidden="true">
        {family.example.split(" · ").map((part) => <span key={part}>{part}</span>)}
      </span>
      <strong>{family.title}</strong>
      <span className="syllable-subtitle">{family.subtitle}</span>
    </>
  );

  if (family.live) {
    return <a className={`syllable-card syllable-card-${family.color} is-live`} href="/kvk">{content}</a>;
  }

  return (
    <button className={`syllable-card syllable-card-${family.color}`} type="button" onClick={() => onComingSoon(family.title)}>
      {content}
    </button>
  );
}

function WordLevel({ level, selected, onSelect }) {
  return (
    <button className={`word-level word-level-${level.color} ${selected ? "is-selected" : ""}`} type="button" onClick={onSelect} aria-pressed={selected}>
      <span className="word-level-number">{String(level.number).padStart(2, "0")}</span>
      <span className="word-level-copy"><strong>{level.title}</strong><span>{level.subtitle}</span></span>
      <ChevronRight size={19} aria-hidden="true" />
    </button>
  );
}

function MatchPreview({ level, onChooseLevel }) {
  return (
    <div className={`match-preview match-preview-${level.color}`}>
      <div className="match-preview-head">
        <span className="match-preview-label"><Image size={15} /> Padan perkataan dengan gambar</span>
        <span className="match-preview-count">{level.skills.length} kemahiran</span>
      </div>
      <div className="match-board" aria-label="Contoh padanan perkataan dengan gambar">
        <div className="picture-tile"><span aria-hidden="true">🍎</span><strong>epal</strong></div>
        <div className="match-connector" aria-hidden="true"><ArrowRight size={18} /></div>
        <div className="picture-tile"><span aria-hidden="true">🏠</span><strong>rumah</strong></div>
      </div>
      <div className="match-preview-foot">
        <div><span>Level {level.number}</span><strong>{level.title}</strong></div>
        <button type="button" onClick={onChooseLevel}>Pilih level <ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

function BMPracticeModule({ view, onBack, onComingSoon, notice }) {
  const [selectedLevel, setSelectedLevel] = useState(WORD_LEVELS[0]);

  const showSyllables = view === "suku-kata";
  const showWords = view === "perkataan";

  return (
    <div className="home-content hub-content">
      <div className="hub-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih subjek">
          <ArrowLeft size={18} /> <span>Subjek</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><BookOpen size={15} /> Bahasa Melayu <span>/ Malay</span></span>
          <h1>{showSyllables ? "Membaca suku kata" : "Perkataan"}</h1>
          <p>{showSyllables ? "Read sounds and open the next reading door." : "Match each word to the picture that belongs."}</p>
        </div>
        <div className="hub-hero-badge"><Trophy size={18} /><span><strong>{showSyllables ? "1" : "4"}</strong> {showSyllables ? "permainan sedia" : "level sedia"}</span></div>
      </div>

      {showSyllables && <section className="hub-section syllable-section" aria-labelledby="syllable-title">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">01 / Bunyi</span>
            <h2 id="syllable-title">Membaca suku kata</h2>
            <p>Pilih bunyi yang mahu kita buka hari ini.</p>
          </div>
          <span className="progress-stamp"><CheckCircle2 size={16} /> 1 / 4 sedia</span>
        </div>
        <div className="syllable-grid">
          {SYLLABLE_FAMILIES.filter((family) => family.id !== "kv").map((family) => <SyllableCard key={family.id} family={family} onComingSoon={onComingSoon} />)}
        </div>
      </section>}

      {showWords && <section className="hub-section word-section" aria-labelledby="word-title">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">02 / Padanan</span>
            <h2 id="word-title">Perkataan</h2>
            <p>32 kemahiran disusun dari mudah ke lebih yakin.</p>
          </div>
          <span className="skill-count"><Pencil size={15} /> 32 kemahiran</span>
        </div>
        <div className="word-layout">
          <div className="word-level-list" aria-label="Level perkataan">
            {WORD_LEVELS.map((level) => (
              <WordLevel key={level.number} level={level} selected={selectedLevel.number === level.number} onSelect={() => setSelectedLevel(level)} />
            ))}
          </div>
          <MatchPreview level={selectedLevel} onChooseLevel={() => onComingSoon(`Perkataan level ${selectedLevel.number}`)} />
        </div>
      </section>}


      {notice && <div className="home-notice" role="status"><Sparkles size={17} /> <span>{notice}</span></div>}
    </div>
  );
}

function LetterMatchTest() {
  const [target, setTarget] = useState(HURUF[0]);
  const [feedback, setFeedback] = useState(null);

  function chooseAnswer(answer) {
    setFeedback(answer.letter === target.letter
      ? { type: "correct", text: `Betul! ${target.letter} jadi ${target.letter.toLowerCase()}.` }
      : { type: "retry", text: `Cuba lagi. Cari pasangan kecil untuk ${target.letter}.` });
  }

  function nextQuestion() {
    const nextIndex = (HURUF.findIndex((item) => item.letter === target.letter) + 1) % HURUF.length;
    setTarget(HURUF[nextIndex]);
    setFeedback(null);
  }

  return (
    <div className="letter-test-card match-test-card">
      <div className="letter-test-heading"><span className="test-number">01</span><div><span className="section-kicker">Uji diri</span><h3>Padan besar dengan kecil</h3></div></div>
      <p className="letter-test-prompt">Cari pasangan untuk</p>
      <div className="match-target-letter">{target.letter}</div>
      <div className="lowercase-choice-row" aria-label={`Pilih huruf kecil untuk ${target.letter}`}>
        {HURUF.map((item) => <button className="lowercase-choice" type="button" key={item.letter} onClick={() => chooseAnswer(item)}>{item.letter.toLowerCase()}</button>)}
      </div>
      {feedback && <p className={`letter-feedback ${feedback.type}`} role="status">{feedback.text}</p>}
      <button className="secondary-action" type="button" onClick={nextQuestion} disabled={feedback?.type !== "correct"}><RefreshCcw size={16} /> Soalan seterusnya</button>
    </div>
  );
}

function SoundChoice({ item, isSelected, isSpeaking, index, onChoose, kind = "vowel" }) {
  const displayLabel = vowelDisplayLabel(item);

  return (
    <button
      className={`sound-choice sound-choice-${kind} ${isSelected ? "is-selected" : ""} ${isSpeaking ? "is-speaking" : ""}`}
      style={{ "--sound-index": index }}
      type="button"
      onClick={() => onChoose(item)}
      aria-pressed={isSelected}
      aria-label={`Dengar bunyi ${displayLabel}`}
      title={`Dengar ${displayLabel}`}
    >
      <strong>{item.label}</strong>
      {item.variant && <span className="sound-choice-variant">{item.variant}</span>}
      <span className="letter-button-ripple" aria-hidden="true"><i /><i /><i /></span>
    </button>
  );
}

function MalaySoundPanel({ items, selectedItem, onSelect, title, description, kind = "vowel" }) {
  const [speakingItem, setSpeakingItem] = useState(null);
  const soundTimer = useRef(null);

