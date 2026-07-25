import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  Eraser,
  Image,
  Languages,
  LockKeyhole,
  Maximize2,
  Mic,
  Minimize2,
  Minus,
  PenLine,
  Pencil,
  Play,
  Plus,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  X
} from "lucide-react";
import { ENDINGS, pickAdaptiveEnding, pickSyllable } from "./data/kvk.js";
import "./styles.css";

const OPEN_DURATION = 1280;
const NEXT_ROUND_DELAY = 900;

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
    if (phase === "opening") return;

    clearTimers();
    const nextSyllable = pickSyllable(nextEnding, previousSyllable.current);
    previousSyllable.current = nextSyllable;
    setCurrentEnding(nextEnding);
    setSyllable(nextSyllable);
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
              <button className="primary-action" type="button" onClick={startAdaptiveRound}>
                <DoorOpen size={20} /> Mula!
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

const SYLLABLE_FAMILIES = [
  { id: "kv", title: "KV", subtitle: "bunyi asas", example: "ba · bi · bu", live: false, color: "mint" },
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
  { id: "tambah", title: "Operasi tambah", english: "Addition", symbol: "+", helper: "Gabung nombor", color: "coral", Icon: Plus },
  { id: "tolak", title: "Operasi tolak", english: "Subtraction", symbol: "-", helper: "Ambil dan kira", color: "mint", Icon: Minus },
  { id: "darab", title: "Operasi darab", english: "Multiplication", symbol: "x", helper: "Kumpulan sama banyak", color: "lemon", Icon: Star },
  { id: "bahagi", title: "Operasi bahagi", english: "Division", symbol: "÷", helper: "Kongsi sama rata", color: "blue", Icon: Calculator }
];

const HURUF = [
  { letter: "A", sound: "a", word: "ayam", emoji: "\u{1F414}", accepted: ["a", "ay", "ei"] },
  { letter: "B", sound: "be", word: "bola", emoji: "\u{26BD}", accepted: ["b", "be", "bee"] },
  { letter: "C", sound: "ce", word: "cawan", emoji: "\u{1F375}", accepted: ["c", "ce", "si", "see"] },
  { letter: "D", sound: "de", word: "dadu", emoji: "\u{1F3B2}", accepted: ["d", "de", "di", "dee"] }
];

const LETTER_STROKES = {
  A: ["M 48 168 L 98 32", "M 98 32 L 150 168", "M 70 112 L 128 112"],
  B: ["M 54 168 L 54 32", "M 54 34 C 142 18 144 84 58 92", "M 58 92 C 154 76 158 170 54 166"],
  C: ["M 148 58 C 112 16 54 30 45 96 C 36 160 112 184 150 138"],
  D: ["M 54 168 L 54 32", "M 55 34 C 166 18 170 174 55 166"]
};

const BM_MODULES = [
  { id: "huruf", title: "Huruf", english: "Letters", description: "Kenal bentuk, bunyi dan cara menulis huruf.", sample: "A a", color: "coral", Icon: PenLine },
  { id: "suku-kata", title: "Suku Kata", english: "Syllables", description: "Buka bunyi KV, KVK dan pintu bacaan seterusnya.", sample: "ba · bas", color: "mint", Icon: BookOpen },
  { id: "perkataan", title: "Perkataan", english: "Words", description: "Padan perkataan dengan gambar ikut level.", sample: "epal · rumah", color: "blue", Icon: Image }
];

function speakLetter(letter) {
  if (!window.speechSynthesis) return;
  const voiceLine = new window.SpeechSynthesisUtterance(`${letter.sound}. ${letter.word}`);
  voiceLine.lang = "ms-MY";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(voiceLine);
}

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
        <div className="hub-hero-badge"><Star size={18} fill="currentColor" /><span><strong>3</strong> pilihan belajar</span></div>
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

function LetterRecognitionPanel({ selectedLetter, onSelect }) {
  return (
    <div className="letter-panel letter-recognition-panel">
      <div className="letter-panel-heading">
        <span className="section-kicker">Aktiviti 01 / Kenal</span>
        <h3>Kenal huruf</h3>
        <p>Pilih huruf. Look at its shape, sound and example.</p>
      </div>
      <div className="letter-choice-row" aria-label="Pilih huruf untuk belajar">
        {HURUF.map((item) => (
          <button className={`letter-choice ${selectedLetter.letter === item.letter ? "is-selected" : ""}`} type="button" key={item.letter} onClick={() => onSelect(item)} aria-pressed={selectedLetter.letter === item.letter}>
            <strong>{item.letter}</strong><span>{item.letter.toLowerCase()}</span>
          </button>
        ))}
      </div>
      <div className="letter-focus-card">
        <div className="letter-focus-pair"><span>{selectedLetter.letter}</span><span>{selectedLetter.letter.toLowerCase()}</span></div>
        <div className="letter-focus-word"><span className="letter-picture" aria-hidden="true">{selectedLetter.emoji}</span><strong>{selectedLetter.word}</strong><span>bunyi {selectedLetter.sound}</span></div>
        <button className="round-icon-action" type="button" onClick={() => speakLetter(selectedLetter)} title="Dengar bunyi huruf"><Volume2 size={20} /></button>
      </div>
    </div>
  );
}

function LetterStrokePractice({ letter }) {
  const [strokeRun, setStrokeRun] = useState(0);
  const strokes = LETTER_STROKES[letter.letter];

  return (
    <div className="letter-panel stroke-practice-panel">
      <div className="letter-panel-heading">
        <span className="section-kicker">Aktiviti 02 / Tulis</span>
        <h3>Ikut jejak huruf</h3>
        <p>Follow the moving strokes, then try it on paper.</p>
      </div>
      <div className="stroke-board">
        <svg key={strokeRun} className="stroke-guide-svg is-playing" viewBox="0 0 200 200" role="img" aria-label={`Animasi menulis huruf ${letter.letter}`}>
          {strokes.map((path, index) => <path key={path} d={path} style={{ "--stroke-delay": `${index * .28}s` }} />)}
        </svg>
        <span className="stroke-board-letter">{letter.letter}</span>
      </div>
      <button className="secondary-action" type="button" onClick={() => setStrokeRun((current) => current + 1)}><Play size={16} /> Lihat langkah lagi</button>
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
          <span className="progress-stamp"><CheckCircle2 size={16} /> 1 / 5 sedia</span>
        </div>
        <div className="syllable-grid">
          {SYLLABLE_FAMILIES.map((family) => <SyllableCard key={family.id} family={family} onComingSoon={onComingSoon} />)}
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

function LetterSoundTest({ letter }) {
  const [status, setStatus] = useState({ type: "idle", text: "Tekan mula untuk gunakan mikrofon." });
  const recognitionRef = useRef(null);

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
      <div className="sound-target"><strong>{letter.letter}</strong><span>{letter.sound}</span></div>
      <button className="mic-action" type="button" onClick={startListening} disabled={status.type === "requesting" || status.type === "listening"}><Mic size={18} /> {status.type === "listening" ? "Sedang dengar..." : "Mula baca"}</button>
      <p className={`letter-feedback ${status.type}`} role="status"><AudioLines size={15} /> {status.text}</p>
    </div>
  );
}

function LetterWritingTest({ letter }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasMarks, setHasMarks] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const density = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(bounds.width * density));
      canvas.height = Math.max(1, Math.round(bounds.height * density));
      const context = canvas.getContext("2d");
      context.scale(density, density);
      context.lineWidth = 5;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#19384a";
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  function pointerPoint(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function beginStroke(event) {
    const canvas = event.currentTarget;
    canvas.setPointerCapture?.(event.pointerId);
    const point = pointerPoint(event);
    const context = canvas.getContext("2d");
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawingRef.current = true;
    setHasMarks(true);
    setResult("");
  }

  function drawStroke(event) {
    if (!drawingRef.current) return;
    const point = pointerPoint(event);
    const context = event.currentTarget.getContext("2d");
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function endStroke() {
    drawingRef.current = false;
  }

  function clearWriting() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setHasMarks(false);
    setResult("");
  }

  return (
    <div className="letter-test-card writing-test-card">
      <div className="letter-test-heading"><span className="test-number">03</span><div><span className="section-kicker">Uji diri</span><h3>Tulis huruf</h3></div></div>
      <p className="letter-test-prompt">Tulis huruf <strong>{letter.letter}</strong> di dalam kotak</p>
      <div className="writing-canvas-wrap">
        <span className="writing-target-letter" aria-hidden="true">{letter.letter}</span>
        <canvas ref={canvasRef} aria-label={`Ruang menulis huruf ${letter.letter}`} onPointerDown={beginStroke} onPointerMove={drawStroke} onPointerUp={endStroke} onPointerCancel={endStroke} />
      </div>
      <div className="writing-actions">
        <button className="secondary-action" type="button" onClick={clearWriting}><Eraser size={16} /> Bersih</button>
        <button className="primary-mini-action" type="button" onClick={() => setResult(hasMarks ? `Ada jejak tulisan. Cuba ikut bentuk ${letter.letter} sekali lagi.` : "Cuba tulis dahulu.")}><CheckCircle2 size={16} /> Semak</button>
      </div>
      {result && <p className="letter-feedback" role="status">{result}</p>}
    </div>
  );
}

function HurufModule({ onBack }) {
  const [selectedLetter, setSelectedLetter] = useState(HURUF[0]);

  return (
    <div className="home-content hub-content letter-learning-content">
      <div className="hub-hero letter-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih ruang Bahasa Melayu">
          <ArrowLeft size={18} /> <span>Bahasa Melayu</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><PenLine size={15} /> Huruf <span>/ Letters</span></span>
          <h1>Kenal, bunyi, tulis!</h1>
          <p>Look, listen and make each letter with your own hand.</p>
        </div>
        <div className="letter-hero-badge"><span>A</span><span>a</span><strong>4 huruf</strong></div>
      </div>

      <section className="letter-learning-section" aria-labelledby="letter-learning-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="letter-learning-title">Huruf hari ini</h2><p>Pilih huruf, lihat jejaknya dan dengar bunyinya.</p></div>
          <span className="skill-count"><Volume2 size={15} /> Comic handwriting</span>
        </div>
        <div className="letter-learning-grid">
          <LetterRecognitionPanel selectedLetter={selectedLetter} onSelect={setSelectedLetter} />
          <LetterStrokePractice letter={selectedLetter} />
        </div>
      </section>

      <section className="letter-test-section" aria-labelledby="letter-test-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Test / Uji diri</span><h2 id="letter-test-title">Cuba sendiri</h2><p>Three small challenges to show what you know.</p></div>
          <span className="skill-count"><CheckCircle2 size={15} /> 3 aktiviti</span>
        </div>
        <div className="letter-test-grid">
          <LetterMatchTest />
          <LetterSoundTest letter={selectedLetter} />
          <LetterWritingTest letter={selectedLetter} />
        </div>
      </section>
    </div>
  );
}

function BahasaMelayuHub({ onBack, onComingSoon, notice }) {
  const [module, setModule] = useState(null);

  function changeModule(nextModule) {
    setModule(nextModule);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  if (module === "huruf") return <HurufModule onBack={() => changeModule(null)} />;
  if (module === "suku-kata") return <BMPracticeModule view="suku-kata" onBack={() => changeModule(null)} onComingSoon={onComingSoon} notice={notice} />;
  if (module === "perkataan") return <BMPracticeModule view="perkataan" onBack={() => changeModule(null)} onComingSoon={onComingSoon} notice={notice} />;

  return <BMLearningPicker onBack={onBack} onChoose={changeModule} />;
}

function MathematicsHub({ onBack, onComingSoon, notice }) {
  return (
    <div className="home-content hub-content math-hub-content">
      <div className="hub-hero math-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih subjek">
          <ArrowLeft size={18} /> <span>Subjek</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Calculator size={15} /> Matematik <span>/ Mathematics</span></span>
          <h1>Kira, cuba, tepuk tangan!</h1>
          <p>Choose an operation and make numbers your playground.</p>
        </div>
        <div className="math-hero-equation" aria-hidden="true"><span>3</span><b>+</b><span>2</span><b>=</b><strong>5</strong></div>
      </div>

      <section className="hub-section operation-section" aria-labelledby="operation-title">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">01 / Nombor</span>
            <h2 id="operation-title">Pilih operasi</h2>
            <p>Pick a maths move to practise next.</p>
          </div>
          <span className="skill-count"><Calculator size={15} /> 4 ruang latihan</span>
        </div>
        <div className="operation-grid">
          {MATH_OPERATIONS.map(({ id, title, english, symbol, helper, color, Icon }) => (
            <button className={`operation-card operation-card-${color}`} type="button" key={id} onClick={() => onComingSoon(title)}>
              <span className="operation-card-icon"><Icon size={23} strokeWidth={2.8} /></span>
              <span className="operation-symbol" aria-hidden="true">{symbol}</span>
              <span className="operation-copy"><strong>{title}</strong><span>{english}</span><em>{helper}</em></span>
              <span className="operation-status">Akan datang <LockKeyhole size={14} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="math-practice-strip" aria-label="Contoh ruang matematik">
        <div className="math-strip-icon"><Calculator size={26} /></div>
        <div><span className="section-kicker">Ruang kira-kira</span><strong>Setiap jawapan betul jadi satu bintang.</strong></div>
        <div className="star-row" aria-hidden="true"><Star size={22} fill="currentColor" /><Star size={22} fill="currentColor" /><Star size={22} fill="currentColor" /><Star size={22} /></div>
      </section>

      {notice && <div className="home-notice" role="status"><Sparkles size={17} /> <span>{notice}</span></div>}
    </div>
  );
}

function SubjectPicker({ onChooseSubject }) {
  return (
    <div className="home-content picker-content">
      <div className="picker-copy">
        <span className="home-eyebrow"><Sparkles size={15} /> Ruang belajar / learning space</span>
        <h1>Saya nak belajar <span>I want to learn</span></h1>
        <p>Pilih satu subjek untuk mulakan misi kecil hari ini.</p>
      </div>
      <div className="subject-grid">
        <SubjectCard title="Bahasa Melayu" english="Malay" description="Baca bunyi, bina perkataan, padan gambar." type="book" color="coral" onClick={() => onChooseSubject("bm")} />
        <SubjectCard title="Matematik" english="Mathematics" description="Kira nombor dengan tambah, tolak, darab, bahagi." type="math" color="blue" onClick={() => onChooseSubject("math")} />
      </div>
      <div className="picker-footer">
        <span><Star size={16} fill="currentColor" /> Belajar sedikit demi sedikit</span>
        <span>Small steps, big wins <Trophy size={16} /></span>
      </div>
    </div>
  );
}

function HomeLanding() {
  const [subject, setSubject] = useState(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  function chooseSubject(nextSubject) {
    setSubject(nextSubject);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showComingSoon(label) {
    setNotice(`${label} akan datang. Kita simpan ruang ini untuk permainan seterusnya!`);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 4200);
  }

  return (
    <main className="home-page">
      <div className="home-grid-lines" aria-hidden="true" />
      <header className="home-topbar">
        <button className="home-brand" type="button" onClick={() => chooseSubject(null)} aria-label="Kembali ke pilih subjek">
          <span className="brand-tile brand-tile-a">A</span><span className="brand-tile brand-tile-one">1</span><span className="brand-tile brand-tile-star"><Star size={13} fill="currentColor" /></span>
          <span className="brand-name">Bijak <em>belajar</em></span>
        </button>
        <div className="home-topbar-note"><span className="status-dot" /> Jom mula!</div>
      </header>

      {subject === "bm" && <BahasaMelayuHub onBack={() => chooseSubject(null)} onComingSoon={showComingSoon} notice={notice} />}
      {subject === "math" && <MathematicsHub onBack={() => chooseSubject(null)} onComingSoon={showComingSoon} notice={notice} />}
      {!subject && <SubjectPicker onChooseSubject={chooseSubject} />}

      <footer className="home-footer"><span>Bahasa Melayu + Matematik</span><span>Untuk belajar bersama-sama</span></footer>
    </main>
  );
}

function HomePlaceholder() {
  return null;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/kvk" ? <KVKGame /> : <HomeLanding />;
}
/*
  return (
    <main className="placeholder-page">
      <div className="placeholder-mark"><DoorOpen /></div>
      <p className="kicker">Bijak · pemulihan bacaan</p>
      <h1>Ruang latihan</h1>
      <p>Modul sedang disusun. Mulakan dengan pintu KVK.</p>
      <a className="placeholder-link" href="/kvk">Buka Bijak KVK <span aria-hidden="true">→</span></a>
    </main>
  );
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/kvk" ? <KVKGame /> : <HomePlaceholder />;
}
*/
