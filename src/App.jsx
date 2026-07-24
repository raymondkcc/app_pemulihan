import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, DoorOpen, LockKeyhole, Maximize2, Minimize2, RotateCcw, X } from "lucide-react";
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

  function startCategoryRound(nextEnding) {
    if (phase === "opening") return;
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
              <span>atau rawak</span>
            </div>
            <div className="category-grid" aria-label="Kategori huruf akhir">
              {ENDINGS.map((letter) => (
                <button
                  className={`category-button ${selectedEnding === letter ? "is-selected" : ""}`}
                  type="button"
                  key={letter}
                  aria-pressed={selectedEnding === letter}
                  onClick={() => startCategoryRound(letter)}
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

function HomePlaceholder() {
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
