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
    if (speakingLetter) return;
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

function SoundChoice({ item, isSelected, isSpeaking, isUnavailable = false, index, onChoose, kind = "vowel" }) {
  const displayLabel = vowelDisplayLabel(item);
  const accessibleLabel = isUnavailable
    ? `${displayLabel} tidak digunakan untuk e pepet`
    : `Dengar bunyi ${displayLabel}`;

  return (
    <button
      className={`sound-choice sound-choice-${kind} ${isSelected ? "is-selected" : ""} ${isSpeaking ? "is-speaking" : ""} ${isUnavailable ? "is-unavailable" : ""}`}
      style={{ "--sound-index": index }}
      type="button"
      onClick={() => onChoose(item)}
      disabled={isSpeaking || isUnavailable}
      aria-pressed={isSelected}
      aria-label={accessibleLabel}
      title={accessibleLabel}
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

  useEffect(() => {
    const removeVoiceListener = warmSpeechEngine();
    return () => {
      removeVoiceListener();
      window.clearTimeout(soundTimer.current);
    };
  }, []);

  function chooseItem(item) {
    if (speakingItem) return;
    onSelect(item);
    setSpeakingItem(item.id);
    window.clearTimeout(soundTimer.current);
    soundTimer.current = window.setTimeout(() => setSpeakingItem(null), 900);
    if (item.audioPath) playSyllableAudio(item);
    else speakMalayText(item.sound);
  }

  return (
    <div className={`letter-panel sound-learning-panel sound-learning-panel-${kind}`}>
      <div className="letter-panel-heading">
        <span className="section-kicker">Aktiviti 01 / Dengar</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className={`sound-choice-row sound-choice-row-${kind}`} aria-label={`Pilih ${title.toLowerCase()}`}>
        {items.map((item, index) => (
          <SoundChoice key={item.id} item={item} index={index} kind={kind} isSelected={selectedItem.id === item.id} isSpeaking={speakingItem === item.id} onChoose={chooseItem} />
        ))}
      </div>
      <div className="letter-selected-card sound-selected-card" role="status" aria-live="polite">
        <span>Bunyi dipilih</span>
        <strong>{vowelDisplayLabel(selectedItem)}</strong>
        <em>{speakingItem ? "Sedang bunyi..." : "Tekan petak untuk dengar"}</em>
      </div>
    </div>
  );
}

function ScreamAnimalCard() {
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  function handleClick() {
    setPlaying(true);
    setPlayCount((count) => count + 1);
    playSyllableAudio({ audioPath: "/audio/vowels/scream-a.mp3" });
  }

  return (
    <section className="scream-section" aria-labelledby="scream-title">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Aktiviti seronok / Fun</span>
          <h2 id="scream-title">A untuk Ayam!</h2>
          <p>Tekan ayam untuk dengar bunyi "a" — aaaaahh!</p>
        </div>
        <span className="skill-count"><Volume2 size={15} /> Jerit aaaaahh</span>
      </div>
      <button
        className={`scream-animal-card ${playing ? "is-playing" : ""}`}
        type="button"
        onClick={handleClick}
        aria-label="Tekan gambar ayam untuk mainkan bunyi aaaaahh"
      >
        <span className="scream-animal-frame">
          <img
            key={playCount}
            className="scream-animal-image"
            src={playing ? "/images/vowels/ayam-scream.gif" : "/images/vowels/ayam-scream-poster.png"}
            alt=""
            draggable="false"
          />
          {!playing && (
            <span className="scream-play-badge" aria-hidden="true">
              <Volume2 size={22} fill="currentColor" />
            </span>
          )}
        </span>
        <span className="scream-caption">
          {playing ? "Aaaaahh! Tekan lagi untuk ulang" : "Tekan untuk jerit aaaaahh!"}
        </span>
      </button>
    </section>
  );
}

function VokalModule({ onBack }) {
  const [selectedVowel, setSelectedVowel] = useState(VOKAL[0]);

  return (
    <div className="home-content hub-content sound-module-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih ruang Bahasa Melayu">
          <ArrowLeft size={18} /> <span>Bahasa Melayu</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Volume2 size={15} /> Vokal <span>/ Vowels</span></span>
          <h1>Dengar bunyi vokal</h1>
          <p>Tekan a, e pepet, e taling, i, o atau u untuk dengar bunyi Bahasa Melayu.</p>
        </div>
        <div className="sound-hero-badge"><Volume2 size={18} /><span><strong>6</strong> bunyi sedia</span></div>
      </div>

      <section className="letter-learning-section" aria-labelledby="vowel-learning-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="vowel-learning-title">Vokal Bahasa Melayu</h2><p>Pilih satu vokal dan dengar bunyinya.</p></div>
          <span className="skill-count"><Volume2 size={15} /> Bunyi Melayu</span>
        </div>
        <div className="letter-learning-grid letter-learning-grid-single">
          <MalaySoundPanel items={VOKAL} selectedItem={selectedVowel} onSelect={setSelectedVowel} title="Kenal bunyi vokal" description="Tekan satu vokal untuk dengar bunyinya." />
        </div>
      </section>

      <ScreamAnimalCard />
    </div>
  );
}

function KVSoundTable({ selectedItem, onSelect, eSound }) {
  const [speakingItem, setSpeakingItem] = useState(null);
  const soundTimer = useRef(null);
  const kvRows = createKvRows(eSound);
  const vowelItems = getKvVowelItems(eSound);

  useEffect(() => {
    const removeVoiceListener = warmSpeechEngine();
    return () => {
      removeVoiceListener();
      window.clearTimeout(soundTimer.current);
    };
  }, []);

  function isUnavailable(item) {
    return eSound === "e-pepet" && (item.syllable === "we" || item.syllable === "ye");
  }

  function chooseItem(item) {
    if (speakingItem || isUnavailable(item)) return;
    onSelect(item);
    setSpeakingItem(item.id);
    window.clearTimeout(soundTimer.current);
    soundTimer.current = window.setTimeout(() => setSpeakingItem(null), 1000);
    if (item.audioPath) playSyllableAudio(item);
    else speakMalayText(item.sound);
  }

  return (
    <div className="kv-table-wrap">
      <div className="kv-table" role="table" aria-label="Jadual bunyi vokal dan suku kata KV">
        <div className="kv-table-corner" role="columnheader">Bunyi</div>
        {PACK_VOWELS.map((vowel) => <div className="kv-table-vowel" role="columnheader" key={`head-${vowel}`}>{vowel}</div>)}
        <div className="kv-table-label" role="rowheader">Vokal</div>
        {vowelItems.map((item, index) => <SoundChoice key={`vowel-${item.id}`} item={item} index={index} kind="table-vowel" isSelected={selectedItem.id === item.id} isSpeaking={speakingItem === item.id} onChoose={chooseItem} />)}
        {PACK_ONSETS.map((onset, rowIndex) => (
          <Fragment key={`row-${onset}`}>
            <div className="kv-table-label kv-table-label-kv" role="rowheader">{onset}</div>
            {kvRows[rowIndex].map((item, index) => <SoundChoice key={item.id} item={item} index={index} kind="table-syllable" isSelected={selectedItem.id === item.id} isSpeaking={speakingItem === item.id} isUnavailable={isUnavailable(item)} onChoose={chooseItem} />)}
          </Fragment>
        ))}
      </div>
      <div className="letter-selected-card sound-selected-card" role="status" aria-live="polite">
        <span>Bunyi dipilih</span>
        <strong>{selectedItem.label}</strong>
        <em>{speakingItem ? "Sedang bunyi..." : "Tekan petak untuk dengar"}</em>
      </div>
    </div>
  );
}

function KVModule({ onBack }) {
  const [eSound, setESound] = useState("e-pepet");
  const [selectedItem, setSelectedItem] = useState(() => createKvItem("b", "a", "e-pepet"));

  function changeESound(nextSound) {
    setESound(nextSound);
    setSelectedItem((current) => {
      if (nextSound === "e-pepet" && (current.syllable === "we" || current.syllable === "ye")) {
        return createKvItem("b", "a", nextSound);
      }
      return current.syllable.endsWith("e")
        ? createKvItem(current.syllable[0], "e", nextSound)
        : current;
    });
  }

  return (
    <div className="home-content hub-content sound-module-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke ruang Bahasa Melayu">
          <ArrowLeft size={18} /> <span>Ruang</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><BookOpen size={15} /> KV <span>/ Suku kata</span></span>
          <h1>Buka bunyi KV</h1>
          <p>Tekan mana-mana petak untuk dengar bunyi vokal atau suku kata.</p>
        </div>
        <div className="sound-hero-badge"><BookOpen size={18} /><span><strong>{PACK_ONSETS.length * PACK_VOWELS.length}</strong> bunyi sedia</span></div>
      </div>

      <section className="letter-learning-section kv-learning-section" aria-labelledby="kv-learning-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="kv-learning-title">Vokal dan suku kata</h2><p>Pilih mana-mana petak untuk dengar bunyi KV.</p></div>
          <span className="skill-count"><Volume2 size={15} /> Tekan untuk dengar</span>
        </div>
        <div className="e-sound-picker" role="radiogroup" aria-label="Pilih jenis bunyi e">
          <span className="e-sound-picker-label">Pilih bunyi e</span>
          {E_SOUND_OPTIONS.map((option) => (
            <button className={`e-sound-option ${eSound === option.id ? "is-selected" : ""}`} type="button" role="radio" aria-checked={eSound === option.id} key={option.id} onClick={() => changeESound(option.id)}>
              <strong>{option.label}</strong><span>{option.hint}</span>
            </button>
          ))}
        </div>
        <KVSoundTable selectedItem={selectedItem} onSelect={setSelectedItem} eSound={eSound} />
      </section>
      <section className="kv-pond-launch" aria-label="Permainan Lompat Si Katak Lompat">
        <div>
          <span className="section-kicker">Permainan bunyi</span>
          <strong>Lompat Si Katak Lompat</strong>
          <p>Dengar bunyi KV, kemudian pilih gema yang sama.</p>
        </div>
        <a href="/kv-sound-pond">Main sekarang <ArrowRight size={17} /></a>
      </section>
    </div>
  );
}

function LetterSoundTest({ letter, letterCase }) {
  const [status, setStatus] = useState({ type: "idle", text: "Tekan mula untuk gunakan mikrofon." });
  const recognitionRef = useRef(null);
  const glyph = letterCase === "capital" ? letter.letter : letter.letter.toLowerCase();

  useEffect(() => () => recognitionRef.current?.abort(), []);

  async function startListening() {
    if (recognitionRef.current) recognitionRef.current.abort();
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ type: "error", text: "Mikrofon tidak tersedia pada pelayar ini." });
      return;
    }

    setStatus({ type: "requesting", text: "Minta izin mikrofon..." });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setStatus({ type: "error", text: "Izin mikrofon belum diberi. Cuba benarkan mikrofon dan ulang lagi." });
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus({ type: "error", text: "Auto marking suara belum disokong oleh pelayar ini." });
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ms-MY";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setStatus({ type: "listening", text: `Sebut bunyi ${letter.sound}...` });
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const normalized = transcript.replace(/[^a-z]/g, "");
      const correct = letter.accepted.some((word) => normalized.includes(word.replace(/[^a-z]/g, "")));
      setStatus(correct
        ? { type: "correct", text: `Betul! Saya dengar "${transcript}".` }
        : { type: "retry", text: `Saya dengar "${transcript}". Cuba sebut ${letter.sound}.` });
    };
    recognition.onerror = () => setStatus({ type: "error", text: "Bacaan suara belum dapat didengar. Cuba sekali lagi." });
    recognitionRef.current = recognition;
    setStatus({ type: "listening", text: `Sebut bunyi ${letter.sound}...` });
    try {
      recognition.start();
    } catch {
      setStatus({ type: "error", text: "Bacaan suara belum dapat dimulakan." });
    }
  }

  return (
    <div className="letter-test-card sound-test-card">
      <div className="letter-test-heading"><span className="test-number">02</span><div><span className="section-kicker">Uji diri</span><h3>Dengar dan baca</h3></div></div>
      <p className="letter-test-prompt">Baca huruf ini dengan kuat</p>
      <div className="sound-target"><strong>{glyph}</strong></div>
      <button className="mic-action" type="button" onClick={startListening} disabled={status.type === "requesting" || status.type === "listening"}><Mic size={18} /> {status.type === "listening" ? "Sedang dengar..." : "Mula baca"}</button>
      <p className={`letter-feedback ${status.type}`} role="status">{status.text}</p>
    </div>
  );
}

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

