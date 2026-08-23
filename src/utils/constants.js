
const OPEN_DURATION = 1280;
const NEXT_ROUND_DELAY = 900;

const syllableAudioCache = new Map();
let activeSyllableAudio = null;

function playSyllableAudio(item) {
  const source = syllableAudioPath(item);
  if (!source || !window.Audio) return;

  const audio = syllableAudioCache.get(source) || new window.Audio(source);
  syllableAudioCache.set(source, audio);
  if (activeSyllableAudio && activeSyllableAudio !== audio) {
    activeSyllableAudio.pause();
    activeSyllableAudio.currentTime = 0;
  }
  activeSyllableAudio = audio;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function createExitChallenge() {
  const operator = Math.random() > 0.5 ? "+" : "−";
  let first = 10 + Math.floor(Math.random() * 90);
  let second = 10 + Math.floor(Math.random() * 90);

  if (operator === "−" && second > first) [first, second] = [second, first];

  return {
    first,
    second,
    operator,
    answer: operator === "+" ? first + second : first - second
  };
}

function DoorWindow({ letter, index, phase }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
    if (phase === "opening") {
      const frame = window.requestAnimationFrame(() => setIsOpen(true));
      return () => window.cancelAnimationFrame(frame);
    }
    if (phase === "answering" || phase === "feedback") setIsOpen(true);
  }, [letter, phase]);

  const doorClass = [
    "letter-door",
    isOpen ? "is-open" : ""
  ].filter(Boolean).join(" ");

  return (
    <div
      className={doorClass}
      style={{ "--door-delay": `${index * 110}ms` }}
      aria-label={`Huruf ${letter}`}
    >
      <span className="door-cavity" aria-hidden="true" />
      <span className="letter-face" aria-hidden="true">{letter}</span>
      <span className="saloon-leaf door-left" aria-hidden="true">
        <span className="leaf-lattice" />
        <span className="leaf-slats" />
        <span className="leaf-hinge" />
      </span>
      <span className="saloon-leaf door-right" aria-hidden="true">
        <span className="leaf-lattice" />
        <span className="leaf-slats" />
        <span className="leaf-hinge" />
      </span>
    </div>
  );
}

function ScoreTile({ kind, label, value }) {
  const Icon = kind === "correct" ? Check : kind === "retry" ? X : BookOpen;
  return (
    <div className={`score-tile score-${kind}`}>
      <span className="score-label"><Icon size={14} strokeWidth={3} /> {label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function emptyCategoryStats() {
  return Object.fromEntries(ENDINGS.map((ending) => [ending, { correct: 0, wrong: 0 }]));
}

function CategoryStats({ stats }) {
  return (
    <section className="category-stats" aria-labelledby="category-stats-title">
      <div className="category-stats-heading">
        <h2 id="category-stats-title">Prestasi setiap kategori</h2>
        <span>Latihan akan ikut keperluan</span>
      </div>
      <div className="category-stats-grid">
        {ENDINGS.map((ending) => {
          const current = stats[ending];
          const attempts = current.correct + current.wrong;
          const accuracy = attempts ? Math.round((current.correct / attempts) * 100) : null;
          const needsPractice = attempts >= 2 && accuracy < 60;
          return (
            <div className={`category-stat ${needsPractice ? "needs-practice" : ""}`} key={ending}>
              <strong>-{ending}</strong>
              <span className="stat-accuracy">{accuracy === null ? "-" : `${accuracy}%`}</span>
              <span className="stat-detail"><b>{current.correct}</b> betul · <b>{current.wrong}</b> salah</span>
              <span className="stat-bar" aria-hidden="true"><i style={{ width: `${accuracy ?? 0}%` }} /></span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function KVKGame() {
  const [selectedEnding, setSelectedEnding] = useState(null);
  const [currentEnding, setCurrentEnding] = useState(null);
  const [phase, setPhase] = useState("ready");
  const [syllable, setSyllable] = useState("???");
  const [currentItem, setCurrentItem] = useState(null);
  const [packItems, setPackItems] = useState([]);
  const [packError, setPackError] = useState("");
  const [scores, setScores] = useState({ correct: 0, retry: 0 });
  const [categoryStats, setCategoryStats] = useState(emptyCategoryStats);
  const [roundId, setRoundId] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [exitChallenge, setExitChallenge] = useState(null);
  const [exitAnswer, setExitAnswer] = useState("");
  const [exitError, setExitError] = useState("");
  const previousSyllable = useRef("");
  const timers = useRef([]);
  const exitAnswerInput = useRef(null);
  const fullscreenWasActive = useRef(false);
  const permittedExit = useRef(false);
  const challengeRef = useRef(null);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  useEffect(() => {
    let active = true;
    loadKvkPack()
      .then((items) => {
        if (active) setPackItems(items);
      })
      .catch((error) => {
        if (active) setPackError(error.message || "Audio KVK tidak dapat dimuatkan.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (phase === "answering" && currentItem) playSyllableAudio(currentItem);
  }, [currentItem, phase]);

  useEffect(() => {
    const updateFullscreenState = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);

      if (active) {
        fullscreenWasActive.current = true;
        return;
      }

      if (fullscreenWasActive.current) {
        fullscreenWasActive.current = false;
        if (!permittedExit.current && !challengeRef.current) {
          const challenge = createExitChallenge();
          challengeRef.current = challenge;
          setExitChallenge(challenge);
          setExitAnswer("");
          setExitError("Skrin penuh ditutup. Jawab soalan untuk teruskan.");
        }
        permittedExit.current = false;
      }
    };
    setFullscreenAvailable(Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen));
    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  useEffect(() => {
    if (exitChallenge) exitAnswerInput.current?.focus();
  }, [exitChallenge]);

  function clearTimers() {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }

  function beginRound(nextEnding) {
    if (phase === "opening" || !packItems.length) return;

    clearTimers();
    const nextItem = pickPackSyllable(packItems, nextEnding, previousSyllable.current);
    if (!nextItem) return;
    previousSyllable.current = `${nextItem.syllable}-${nextItem.sound}`;
    setCurrentEnding(nextEnding);
    setCurrentItem(nextItem);
    setSyllable(nextItem.syllable);
    setRoundId((current) => current + 1);
    setPhase("opening");

    timers.current.push(window.setTimeout(() => {
      setPhase("answering");
    }, OPEN_DURATION));
  }

  function startAdaptiveRound() {
    if (phase === "opening") return;
    setSelectedEnding(null);
    beginRound(pickAdaptiveEnding(categoryStats, currentEnding));
  }

  function toggleCategoryRound(nextEnding) {
    if (phase === "opening") return;

    if (selectedEnding === nextEnding) {
      setSelectedEnding(null);
      return;
    }

    setSelectedEnding(nextEnding);
    beginRound(nextEnding);
  }

  function startNextRound() {
    const nextEnding = selectedEnding ?? pickAdaptiveEnding(categoryStats, currentEnding);
    beginRound(nextEnding);
  }

  function recordAnswer(result) {
    if (phase !== "answering") return;

    setScores((current) => ({ ...current, [result]: current[result] + 1 }));
    setCategoryStats((current) => ({
      ...current,
      [currentEnding]: {
        ...current[currentEnding],
        [result === "correct" ? "correct" : "wrong"]: current[currentEnding][result === "correct" ? "correct" : "wrong"] + 1
      }
    }));
    setPhase("feedback");
    clearTimers();
    timers.current.push(window.setTimeout(startNextRound, NEXT_ROUND_DELAY));
  }

  function resetSession() {
    clearTimers();
    previousSyllable.current = "";
    setSelectedEnding(null);
    setCurrentEnding(null);
    setPhase("ready");
    setSyllable("???");
    setCurrentItem(null);
    setScores({ correct: 0, retry: 0 });
    setCategoryStats(emptyCategoryStats());
  }

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      setExitError("Skrin penuh tidak tersedia pada pelayar ini.");
    }
  }

  function requestExitFullscreen() {
    const challenge = createExitChallenge();
    challengeRef.current = challenge;
    setExitChallenge(challenge);
    setExitAnswer("");
    setExitError("");
  }

  function cancelExitChallenge() {
    challengeRef.current = null;
    setExitChallenge(null);
    setExitError("");
  }

  async function submitExitChallenge(event) {
    event.preventDefault();
    if (!exitChallenge || Number(exitAnswer) !== exitChallenge.answer) {
      setExitError("Jawapan belum tepat. Cuba kira semula.");
      return;
    }

    permittedExit.current = true;
    challengeRef.current = null;
    setExitChallenge(null);
    setExitError("");
    if (document.fullscreenElement) await document.exitFullscreen();
    else permittedExit.current = false;
  }

  const total = scores.correct + scores.retry;

  return (
    <main className="app-shell">
      <section className="game-frame" aria-labelledby="game-title">
        <header className="game-header">
          <div className="brand-mark" aria-hidden="true"><DoorOpen size={25} strokeWidth={2.8} /></div>
          <div>
            <p className="kicker">Latihan membaca · KVK</p>
            <h1 id="game-title">Bijak KVK</h1>
            <p className="subtitle">Pintu Bacaan Interaktif</p>
          </div>
          <div className="header-actions">
            <div className="header-lockup"><LockKeyhole size={15} /> sesi {String(total).padStart(2, "0")}</div>
            <button
              className="fullscreen-button"
              type="button"
              onClick={isFullscreen ? requestExitFullscreen : enterFullscreen}
              disabled={!fullscreenAvailable}
              title={isFullscreen ? "Keluar skrin penuh" : "Buka skrin penuh"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isFullscreen ? "Keluar" : "Skrin penuh"}</span>
            </button>
          </div>
        </header>

        <div className="game-body">
          <section className="door-room" aria-label="Pintu KVK">
            <div className="door-row" aria-live="polite" aria-label="Tiga panel huruf KVK">
              {Array.from({ length: 3 }, (_, index) => (
                <DoorWindow key={`${roundId}-${index}`} letter={syllable[index] ?? "?"} index={index} phase={phase} />
              ))}
            </div>
          </section>

          <div className="action-stack">
            {phase === "ready" && (
              <button className="primary-action" type="button" onClick={startAdaptiveRound} disabled={!packItems.length}>
                <DoorOpen size={20} /> {packItems.length ? "Mula!" : "Menyedia bunyi..."}
              </button>
            )}
            {currentItem && (
              <button className="sound-replay-button" type="button" onClick={() => playSyllableAudio(currentItem)} disabled={phase === "opening"}>
                <Volume2 size={18} /> Dengar {currentItem.syllable}
                <span>{currentItem.sound === "e-pepet" ? "e pepet" : currentItem.sound === "e-taling" ? "e taling" : "bunyi Melayu"}</span>
              </button>
            )}
            <div className="answer-actions">
              <button className="answer-button answer-correct" type="button" onClick={() => recordAnswer("correct")} disabled={phase !== "answering"}>
                <Check size={18} /> Betul
              </button>
              <button className="answer-button answer-retry" type="button" onClick={() => recordAnswer("retry")} disabled={phase !== "answering"}>
                <X size={18} /> Cuba lagi
              </button>
            </div>
          </div>

          <div className="scoreboard" aria-label="Rekod sesi">
            <ScoreTile kind="correct" label="Betul" value={scores.correct} />
            <ScoreTile kind="retry" label="Cuba lagi" value={scores.retry} />
            <ScoreTile kind="total" label="Jumlah" value={total} />
          </div>

          <div className="category-section">
            <div className="category-heading">
              <h2>Pilih pintu ikut huruf akhir</h2>
              <span>tekan lagi untuk buang pilihan</span>
            </div>
            <div className="category-grid" aria-label="Kategori huruf akhir">
              {ENDINGS.map((letter) => (
                <button
                  className={`category-button ${selectedEnding === letter ? "is-selected" : ""}`}
                  type="button"
                  key={letter}
                  aria-pressed={selectedEnding === letter}
                  onClick={() => toggleCategoryRound(letter)}
                >
                  -{letter}
                </button>
              ))}
            </div>
          </div>

          {packError && <p className="pack-error" role="alert">{packError}</p>}

          <CategoryStats stats={categoryStats} />

          <button className="reset-button" type="button" onClick={resetSession}>
            <RotateCcw size={15} /> Mula semula sesi
          </button>
        </div>

        {exitChallenge && (
          <div className="challenge-backdrop">
            <form className="challenge-dialog" role="dialog" aria-modal="true" aria-labelledby="challenge-title" onSubmit={submitExitChallenge}>
              <p className="challenge-kicker">Semakan ringkas</p>
              <h2 id="challenge-title">Jawab sebelum keluar</h2>
              <p className="challenge-copy">Kira soalan ini untuk menutup skrin penuh.</p>
              <div className="math-question" aria-live="polite">
                {exitChallenge.first} {exitChallenge.operator} {exitChallenge.second} <span>= ?</span>
              </div>
              <label className="challenge-label" htmlFor="exit-answer">Jawapan</label>
              <input
                ref={exitAnswerInput}
                id="exit-answer"
                className="challenge-input"
                type="number"
                inputMode="numeric"
                value={exitAnswer}
                onChange={(event) => setExitAnswer(event.target.value)}
                autoComplete="off"
                required
              />
              {exitError && <p className="challenge-error" role="alert">{exitError}</p>}
              <div className="challenge-actions">
                <button className="stay-button" type="button" onClick={cancelExitChallenge}>Kekal di sini</button>
                <button className="leave-button" type="submit">Keluar skrin penuh</button>
              </div>
            </form>
          </div>
        )}
      </section>
      <p className="app-note">KVK = konsonan · vokal · konsonan</p>
    </main>
  );
}

const BM_CATEGORIES = [
  {
    id: "huruf",
    title: "Huruf",
    subtitle: "Letters",
    description: "Kenal dan bunyi 26 huruf",
    color: "coral",
    icon: "PenLine",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Belajar bunyi huruf", component: "huruf-belajar" },
      { id: "main", title: "Main", description: "Permainan huruf", component: "huruf-main" },
      { id: "ujian", title: "Ujian", description: "Uji diri", component: "huruf-ujian" }
    ]
  },
  {
    id: "vokal",
    title: "Vokal",
    subtitle: "Vowels",
    description: "Bunyi a e i o u",
    color: "lemon",
    icon: "Volume2",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Kenal bunyi vokal", component: "vokal-belajar" },
      { id: "main", title: "Main", description: "Permainan bunyi haiwan", component: "vokal-main" },
      { id: "ujian", title: "Ujian", description: "Uji sebutan vokal", component: "vokal-ujian" }
    ]
  },
  {
    id: "suku-kata",
    title: "Suku Kata",
    subtitle: "Syllables",
    description: "KV, KVK, dan bunyi bergabung",
    color: "mint",
    icon: "BookOpen",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Jadual bunyi KV", component: "suku-belajar" },
      { id: "main", title: "Main", description: "Lompat Si Katak Lompat", component: "suku-main" },
      { id: "ujian", title: "Ujian", description: "Pintu KVK", component: "suku-ujian" }
    ]
  },
  {
    id: "perkataan",
    title: "Perkataan",
    subtitle: "Words",
    description: "Bina dan kenal perkataan",
    color: "blue",
    icon: "Languages",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Kenal perkataan", component: "perkataan-belajar" },
      { id: "main", title: "Main", description: "Padan gambar", component: "perkataan-main" },
      { id: "ujian", title: "Ujian", description: "Cabaran ayat", component: "perkataan-ujian" }
    ]
  }
];

const SYLLABLE_FAMILIES = [
  { id: "kv", title: "KV", subtitle: "bunyi asas", example: "ba · be · bi · bo · bu", live: true, color: "mint" },
  { id: "kvk", title: "KVK", subtitle: "pintu yang sudah siap", example: "bas · jam · tin", live: true, color: "coral" },
  { id: "kvkk", title: "KVKK", subtitle: "bunyi bergabung", example: "bank · lamp", live: false, color: "lemon" },
  { id: "diftong", title: "Diftong", subtitle: "dua bunyi jadi satu", example: "ai · au · oi", live: false, color: "blue" },
  { id: "digraf", title: "Digraf", subtitle: "dua huruf satu bunyi", example: "ng · ny · sy · kh", live: false, color: "lilac" }
];

const WORD_LEVELS = [
  { number: 1, title: "Mula kenal", subtitle: "Padan benda mudah", color: "mint", skills: ["KV terbuka", "Kata nama biasa", "Satu suku kata", "Padan gambar jelas", "Vokal awal", "Bunyi akhir", "Kata di rumah", "Kata di kelas"] },
  { number: 2, title: "Sudah kenal", subtitle: "Bina perkataan", color: "coral", skills: ["KVK mudah", "Diftong awal", "Digraf awal", "Dua suku kata", "Kata kerja mudah", "Kata sifat mudah", "Padan pasangan", "Cari huruf hilang"] },
  { number: 3, title: "Makin yakin", subtitle: "Pilih makna tepat", color: "lemon", skills: ["Kata majmuk", "Imbuhan mudah", "Kata berulang", "Diftong tengah", "Digraf tengah", "Kata ikut tema", "Gambar bersiri", "Pilih ejaan"] },
  { number: 4, title: "Juara perkataan", subtitle: "Cabaran ayat pendek", color: "blue", skills: ["Baca ayat pendek", "Pilih gambar", "Lengkapkan ayat", "Kata berimbuhan", "Kata hubung", "Susun perkataan", "Faham konteks", "Campur semua bunyi"] }
];

const MATH_OPERATIONS = [
  { id: "tambah", title: "Operasi tambah", english: "Addition", symbol: "+", helper: "Gabung nombor", color: "coral", Icon: Plus, href: "/addition-regroup" },
  { id: "tolak", title: "Operasi tolak", english: "Subtraction", symbol: "-", helper: "Ambil dan kira", color: "mint", Icon: Minus, href: "/minus-regroup" },
  { id: "darab", title: "Operasi darab", english: "Multiplication", symbol: "x", helper: "Kumpulan sama banyak", color: "lemon", Icon: Star, href: "/mosquito-splat?op=darab" },
  { id: "bahagi", title: "Operasi bahagi", english: "Division", symbol: "÷", helper: "Kongsi sama rata", color: "blue", Icon: Calculator }
];

const HURUF = [
  { letter: "A", sound: "a", word: "ayam", emoji: "\u{1F414}", accepted: ["a", "ay", "ei"] },
  { letter: "B", sound: "be", word: "bola", emoji: "\u{26BD}", accepted: ["b", "be", "bee"] },
  { letter: "C", sound: "ce", word: "cawan", emoji: "\u{1F375}", accepted: ["c", "ce", "si", "see"] },
  { letter: "D", sound: "de", word: "dadu", emoji: "\u{1F3B2}", accepted: ["d", "de", "di", "dee"] },
  { letter: "E", sound: "e", word: "epal", emoji: "\u{1F34E}", accepted: ["e", "i"] },
  { letter: "F", sound: "ef", word: "feri", emoji: "\u{26F4}", accepted: ["f", "ef"] },
  { letter: "G", sound: "je", word: "gajah", emoji: "\u{1F418}", accepted: ["g", "je", "gee"] },
  { letter: "H", sound: "ha", word: "harimau", emoji: "\u{1F42F}", accepted: ["h", "ha", "aitch"] },
  { letter: "I", sound: "i", word: "ikan", emoji: "\u{1F41F}", accepted: ["i", "ee"] },
  { letter: "J", sound: "je", word: "jam", emoji: "\u{23F0}", accepted: ["j", "je", "jay"] },
  { letter: "K", sound: "ke", word: "kereta", emoji: "\u{1F697}", accepted: ["k", "ke", "kay"] },
  { letter: "L", sound: "el", word: "lampu", emoji: "\u{1F4A1}", accepted: ["l", "el"] },
  { letter: "M", sound: "em", word: "mata", emoji: "\u{1F441}", accepted: ["m", "em"] },
  { letter: "N", sound: "en", word: "nasi", emoji: "\u{1F35A}", accepted: ["n", "en"] },
  { letter: "O", sound: "o", word: "oren", emoji: "\u{1F34A}", accepted: ["o", "oh"] },
  { letter: "P", sound: "pe", word: "pisang", emoji: "\u{1F34C}", accepted: ["p", "pe", "pee"] },
  { letter: "Q", sound: "kiu", word: "qari", emoji: "\u{1F4D6}", accepted: ["q", "kiu", "cue"] },
  { letter: "R", sound: "ar", word: "rumah", emoji: "\u{1F3E0}", accepted: ["r", "ar"] },
  { letter: "S", sound: "es", word: "sudu", emoji: "\u{1F944}", accepted: ["s", "es"] },
  { letter: "T", sound: "te", word: "topi", emoji: "\u{1F3A9}", accepted: ["t", "te", "tee"] },
  { letter: "U", sound: "u", word: "ular", emoji: "\u{1F40D}", accepted: ["u", "you"] },
  { letter: "V", sound: "ve", word: "van", emoji: "\u{1F69A}", accepted: ["v", "ve"] },
  { letter: "W", sound: "dabliu", word: "wau", emoji: "\u{1FA81}", accepted: ["w", "dabliu", "double you"] },
  { letter: "X", sound: "eks", word: "x-ray", emoji: "\u{1F50D}", accepted: ["x", "eks"] },
  { letter: "Y", sound: "wai", word: "yo-yo", emoji: "\u{1FA80}", accepted: ["y", "wai", "why"] },
  { letter: "Z", sound: "zet", word: "zebra", emoji: "\u{1F993}", accepted: ["z", "zet", "zee"] }
];

const makeStrokeLesson = (paths, steps) => ({ paths, steps });

const MANUSCRIPT_STROKES = {
  capital: {
    A: makeStrokeLesson(["M 48 168 L 98 32", "M 98 32 L 150 168", "M 70 112 L 128 112"], ["Serong turun", "Serong naik", "Palang tengah"]),
    B: makeStrokeLesson(["M 54 168 L 54 32", "M 54 34 C 142 18 144 84 58 92", "M 58 92 C 154 76 158 170 54 166"], ["Garis turun", "Bulat atas", "Bulat bawah"]),
    C: makeStrokeLesson(["M 148 58 C 112 16 54 30 45 96 C 36 160 112 184 150 138"], ["Mula atas, pusing dan tutup bawah"]),
    D: makeStrokeLesson(["M 54 168 L 54 32", "M 55 34 C 166 18 170 174 55 166"], ["Garis turun", "Bulat besar ke bawah"]),
    E: makeStrokeLesson(["M 52 32 L 52 168", "M 52 32 L 150 32", "M 52 100 L 130 100", "M 52 168 L 150 168"], ["Garis turun", "Palang atas", "Palang tengah", "Palang bawah"]),
    F: makeStrokeLesson(["M 52 168 L 52 32", "M 52 32 L 150 32", "M 52 100 L 130 100"], ["Garis turun", "Palang atas", "Palang tengah"]),
    G: makeStrokeLesson(["M 150 58 C 114 15 54 30 45 96 C 38 160 116 184 154 130", "M 154 105 L 105 105"], ["Bentuk bulat", "Masuk palang"]),
    H: makeStrokeLesson(["M 52 32 L 52 168", "M 148 32 L 148 168", "M 52 100 L 148 100"], ["Garis kiri", "Garis kanan", "Palang tengah"]),
    I: makeStrokeLesson(["M 50 32 L 150 32", "M 100 32 L 100 168", "M 50 168 L 150 168"], ["Palang atas", "Garis turun", "Palang bawah"]),
    J: makeStrokeLesson(["M 50 32 L 150 32", "M 130 32 L 130 135 C 130 178 54 180 50 130"], ["Palang atas", "Garis turun dan lengkung"]),
    K: makeStrokeLesson(["M 52 32 L 52 168", "M 52 104 L 148 32", "M 52 104 L 148 168"], ["Garis turun", "Serong atas", "Serong bawah"]),
    L: makeStrokeLesson(["M 52 32 L 52 168", "M 52 168 L 150 168"], ["Garis turun", "Garis bawah"]),
    M: makeStrokeLesson(["M 48 168 L 48 32 L 100 112 L 152 32 L 152 168"], ["Satu garisan bersambung"]),
    N: makeStrokeLesson(["M 52 168 L 52 32", "M 52 32 L 148 168", "M 148 168 L 148 32"], ["Garis kiri", "Serong turun", "Garis kanan"]),
    O: makeStrokeLesson(["M 100 30 C 38 30 38 170 100 170 C 162 170 162 30 100 30"], ["Pusing bulat tanpa putus"]),
    P: makeStrokeLesson(["M 54 168 L 54 32", "M 54 34 C 154 18 154 100 54 96"], ["Garis turun", "Bulat atas"]),
    Q: makeStrokeLesson(["M 100 30 C 38 30 38 170 100 170 C 162 170 162 30 100 30", "M 110 128 L 158 174"], ["Pusing bulat", "Tarik ekor"]),
    R: makeStrokeLesson(["M 54 168 L 54 32", "M 54 34 C 154 18 154 100 54 96", "M 92 96 L 150 168"], ["Garis turun", "Bulat atas", "Serong kaki"]),
    S: makeStrokeLesson(["M 148 48 C 118 16 55 28 50 70 C 45 104 145 100 150 140 C 154 176 76 186 46 144"], ["Pusing dari atas ke bawah"]),
    T: makeStrokeLesson(["M 45 32 L 155 32", "M 100 32 L 100 168"], ["Palang atas", "Garis tengah"]),
    U: makeStrokeLesson(["M 52 32 L 52 125 C 52 184 148 184 148 125 L 148 32"], ["Turun, pusing dan naik"]),
    V: makeStrokeLesson(["M 45 32 L 100 168 L 155 32"], ["Serong turun dan serong naik"]),
    W: makeStrokeLesson(["M 38 32 L 70 168 L 100 90 L 130 168 L 162 32"], ["Empat serong bersambung"]),
    X: makeStrokeLesson(["M 48 32 L 152 168", "M 152 32 L 48 168"], ["Serong turun", "Serong silang"]),
    Y: makeStrokeLesson(["M 48 32 L 100 98 L 152 32", "M 100 98 L 100 168"], ["Dua serong bertemu", "Garis turun"]),
    Z: makeStrokeLesson(["M 48 32 L 152 32", "M 152 32 L 48 168", "M 48 168 L 152 168"], ["Palang atas", "Serong turun", "Palang bawah"])
  },
  small: {
    A: makeStrokeLesson(["M 50 130 C 50 74 142 74 142 130", "M 50 130 C 50 166 142 166 142 130", "M 142 78 L 142 166"], ["Bulat kecil", "Tutup bulat", "Garis akhir"]),
    B: makeStrokeLesson(["M 58 168 L 58 32", "M 58 96 C 150 72 150 168 58 154"], ["Garis turun", "Bulat bawah"]),
    C: makeStrokeLesson(["M 146 92 C 112 62 54 72 50 122 C 46 166 108 174 146 142"], ["Bulat terbuka"]),
    D: makeStrokeLesson(["M 142 32 L 142 166", "M 142 96 C 50 72 50 168 142 150"], ["Garis tinggi", "Bulat bawah"]),
    E: makeStrokeLesson(["M 52 128 C 80 128 120 128 146 106 C 124 70 54 76 50 126 C 48 168 110 178 148 148"], ["Bulat dengan palang"]),
    F: makeStrokeLesson(["M 118 42 C 78 14 66 56 66 96 L 66 168", "M 42 92 L 108 92"], ["Lengkung dan turun", "Palang kecil"]),
    G: makeStrokeLesson(["M 146 94 C 110 62 54 76 52 124 C 50 170 120 174 142 140", "M 142 118 L 104 118 L 104 174"], ["Bulat", "Turun ekor"]),
    H: makeStrokeLesson(["M 58 32 L 58 168", "M 58 110 C 90 78 142 82 142 122 L 142 168"], ["Garis tinggi", "Bahu dan turun"]),
    I: makeStrokeLesson(["M 84 92 L 84 168", "M 84 58 L 84 58"], ["Garis turun", "Titik"]),
    J: makeStrokeLesson(["M 112 92 L 112 166 C 112 190 52 190 52 150", "M 112 58 L 112 58"], ["Garis turun dan lengkung", "Titik"]),
    K: makeStrokeLesson(["M 60 32 L 60 168", "M 60 124 L 132 84", "M 60 124 L 132 168"], ["Garis tinggi", "Serong atas", "Serong bawah"]),
    L: makeStrokeLesson(["M 92 32 L 92 168"], ["Satu garis turun"]),
    M: makeStrokeLesson(["M 44 168 L 44 96 C 44 76 78 76 92 108 C 108 76 148 76 148 108 L 148 168"], ["Turun, dua bahu, turun"]),
    N: makeStrokeLesson(["M 52 168 L 52 100 C 52 76 142 76 142 112 L 142 168"], ["Turun, bahu, turun"]),
    O: makeStrokeLesson(["M 100 82 C 44 82 44 170 100 170 C 156 170 156 82 100 82"], ["Pusing bulat kecil"]),
    P: makeStrokeLesson(["M 58 210 L 58 96 C 58 76 142 76 142 118 C 142 156 58 150 58 118"], ["Garis turun", "Bulat dan ekor bawah"]),
    Q: makeStrokeLesson(["M 100 82 C 44 82 44 170 100 170 C 156 170 156 82 100 82", "M 112 140 L 150 190"], ["Pusing bulat", "Tarik ekor"]),
    R: makeStrokeLesson(["M 58 168 L 58 96 C 58 76 142 76 142 118 C 142 142 102 150 78 132"], ["Turun dan bahu"]),
    S: makeStrokeLesson(["M 142 94 C 124 70 58 74 54 112 C 50 148 134 130 142 164 C 148 194 78 188 52 162"], ["Pusing kecil dari atas"]),
    T: makeStrokeLesson(["M 54 88 L 138 88", "M 96 44 L 96 168"], ["Palang", "Garis turun"]),
    U: makeStrokeLesson(["M 54 92 L 54 140 C 54 180 142 180 142 140 L 142 92"], ["Turun, pusing dan naik"]),
    V: makeStrokeLesson(["M 52 94 L 96 168 L 142 94"], ["Serong turun dan naik"]),
    W: makeStrokeLesson(["M 40 94 L 66 168 L 96 112 L 126 168 L 154 94"], ["Serong berganda"]),
    X: makeStrokeLesson(["M 54 94 L 142 168", "M 142 94 L 54 168"], ["Serong turun", "Serong silang"]),
    Y: makeStrokeLesson(["M 52 94 L 98 132 L 144 94", "M 98 132 L 98 194"], ["Dua serong bertemu", "Ekor turun"]),
    Z: makeStrokeLesson(["M 54 94 L 144 94", "M 144 94 L 54 168", "M 54 168 L 144 168"], ["Palang atas", "Serong turun", "Palang bawah"])
  }
};

const BM_MODULES = [
  { id: "huruf", title: "Huruf", english: "Letters", description: "Kenal bentuk, bunyi dan cara menulis huruf.", sample: "A a", color: "coral", Icon: PenLine },
  { id: "vokal", title: "Vokal", english: "Vowels", description: "Dengar bunyi a, e pepet, e taling, i, o dan u dalam Bahasa Melayu.", sample: "a e-pepet e-taling", color: "lemon", Icon: Volume2 },
  { id: "kv", title: "KV", english: "Open syllables", description: "Dengar vokal dan baca ba, be, bi, bo dan bu.", sample: "ba be bi", color: "blue", Icon: BookOpen },
  { id: "suku-kata", title: "Suku Kata", english: "Syllables", description: "Bina bacaan dengan KVK dan bunyi bergabung.", sample: "bas jam", color: "mint", Icon: BookOpen },
  { id: "perkataan", title: "Perkataan", english: "Words", description: "Padan perkataan dengan gambar ikut level.", sample: "epal · rumah", color: "blue", Icon: Image }
];

