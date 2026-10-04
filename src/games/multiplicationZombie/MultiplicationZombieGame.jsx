import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, RotateCcw, Shield, Sparkles, Volume2, VolumeX, X, Zap } from "lucide-react";
import { getActiveAdult, getActiveStudent, whenAuthReady } from "../../utils/kembaraStore.js";
import {
  DIFFICULTIES,
  DIFFICULTY_INFO,
  QUESTION_COUNTS,
  getNextDifficulty
} from "./multiplicationFacts.js";
import {
  OPERATION_KEYS,
  createOperationEngine,
  operationSelectionFromNumbers
} from "./zombieDefenseFacts.js";
import {
  loadMultiplicationProgress,
  loadMultiplicationReport,
  mergeMultiplicationProgress,
  persistMultiplicationSession
} from "./multiplicationPersistence.js";
import { persistStudentAssessment } from "../../utils/studentAssessments.js";
import {
  loadZombieDefenseProgress,
  saveZombieDefenseSession
} from "./zombieDefensePersistence.js";
import ZombieCanvas from "./ZombieCanvas.jsx";
import "./MultiplicationZombieGame.css";

const MODE_COPY = {
  student: {
    eyebrow: "Latihan adaptif / Adaptive practice",
    title: "Zombie Defense",
    start: "Mula latihan"
  },
  teacher: {
    eyebrow: "Mod pengajaran / Teaching mode",
    title: "Zombie Defense",
    start: "Mula permainan"
  }
};

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function buildInitialNumberSelection() {
  return new Set();
}

function selectAllNumbers() {
  return new Set(Array.from({ length: 9 }, (_, index) => index + 1));
}

function selectedKeysForNumbers(engine, numbers) {
  return new Set(operationSelectionFromNumbers(engine.operation, [...numbers]));
}

function factExpression(fact, operationInfo) {
  if (!fact) return "—";
  return `${fact.first} ${operationInfo.symbol} ${fact.second} = ${fact.answer}`;
}

function playTone(audioRef, type, enabled) {
  if (!enabled || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = audioRef.current || new AudioContextClass();
    audioRef.current = context;
    if (context.state === "suspended") context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const settings = type === "correct"
      ? { start: 420, end: 820, duration: 0.18, wave: "triangle", volume: 0.14 }
      : type === "wrong"
        ? { start: 150, end: 90, duration: 0.18, wave: "sawtooth", volume: 0.08 }
        : type === "gameover"
          ? { start: 180, end: 55, duration: 0.5, wave: "square", volume: 0.11 }
          : { start: 300, end: 500, duration: 0.2, wave: "sine", volume: 0.1 };
    oscillator.type = settings.wave;
    oscillator.frequency.setValueAtTime(settings.start, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(settings.end, context.currentTime + settings.duration);
    gain.gain.setValueAtTime(settings.volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + settings.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + settings.duration);
  } catch {
    // Audio is an enhancement; gameplay must continue when it is blocked.
  }
}

function Keypad({ value, onInput, onDelete, onSubmit, disabled }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <div className="mz-keypad" aria-label="Number keypad">
      {keys.map((number) => (
        <button type="button" key={number} onClick={() => onInput(String(number))} disabled={disabled}>{number}</button>
      ))}
      <button type="button" className="mz-keypad-delete" onClick={onDelete} disabled={disabled}><X size={20} /> <span>Padam</span></button>
      <button type="button" onClick={() => onInput("0")} disabled={disabled}>0</button>
      <button type="button" className="mz-keypad-submit" onClick={onSubmit} disabled={disabled || !value}><Check size={21} /> <span>Serang</span></button>
    </div>
  );
}

function NumberPicker({ engine, selectedNumbers, onToggleNumber, onSelectAll, onClearAll }) {
  const selectedKeys = selectedKeysForNumbers(engine, selectedNumbers);
  const operationLabel = engine.info.label.toLowerCase();
  const note = engine.operation === "darab"
    ? "Pilih nombor sifir. Contoh: pilih 9 untuk 1 × 9 hingga 9 × 9 dan 9 × 1 hingga 9 × 9, tanpa gandaan 9 × 9."
    : "Soalan yang menggunakan mana-mana nombor pilihan akan dimasukkan ke dalam sesi.";
  return (
    <div className="mz-fact-picker mz-number-picker">
      <div className="mz-picker-toolbar">
        <div><strong>{selectedNumbers.size}/9</strong><span>nombor dipilih / numbers selected</span></div>
        <div className="mz-picker-actions">
          <button type="button" onClick={onSelectAll}>Pilih semua</button>
          <button type="button" onClick={onClearAll}>Kosongkan</button>
        </div>
      </div>
      <div className="mz-number-grid" role="group" aria-label={`Pilih nombor untuk ${operationLabel}`}>
        {Array.from({ length: 9 }, (_, index) => {
          const number = index + 1;
          const selected = selectedNumbers.has(number);
          return <button className={`mz-number-choice ${selected ? "is-selected" : ""}`} type="button" key={number} onClick={() => onToggleNumber(number)} aria-pressed={selected}><strong>{number}</strong><span>{selectedKeysForNumbers(engine, new Set([number])).size} fakta</span></button>;
        })}
      </div>
      <p className="mz-picker-note">{note}</p>
      <p className="mz-picker-total">{selectedKeys.size} fakta {engine.info.label.toLowerCase()} tersedia untuk sesi ini.</p>
    </div>
  );
}

function SetupPanel({ mode, engine, selectedNumbers, difficulty, questionCount, onToggleNumber, onSelectAll, onClearAll, onDifficulty, onQuestionCount, onStart, error, startDisabled }) {
  const copy = MODE_COPY[mode];
  const operationLabel = engine.info.label.toLowerCase();
  const usesNumberPicker = mode === "teacher" && engine.operation === "darab";
  const difficultyStep = usesNumberPicker ? "02" : "01";
  const questionCountStep = usesNumberPicker ? "03" : "02";
  const subtitle = mode === "student"
    ? `Jawab pantas. Zombie Defense akan mencari fakta ${operationLabel} yang perlu kamu kuatkan.`
    : usesNumberPicker
      ? "Pilih nombor sifir untuk latihan ini, kemudian mula serangan."
      : `Pilih tahap kesukaran untuk semua fakta ${operationLabel}, kemudian mula serangan.`;
  return (
    <main className="mz-page mz-setup-page">
      <a className="mz-back-link" href={mode === "teacher" ? "/cikgu/mengajar" : "/murid/matematik"}><ArrowLeft size={18} /> Kembali / Back</a>
      <section className="mz-setup-card">
        <div className="mz-hero-art" aria-hidden="true"><span className="mz-hero-zombie">🧟</span><span className="mz-hero-magic">✦</span><span className="mz-hero-brain">🧠</span></div>
        <div className="mz-setup-copy">
          <span className="mz-eyebrow"><Shield size={16} /> {copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{subtitle}</p>
        </div>

        {mode === "student" ? (
          <div className="mz-student-lock-card">
            <div className="mz-lock-icon"><Zap size={22} /></div>
            <div><strong>Latihan dipilih untuk kamu</strong><span>Semua fakta {operationLabel} · 15 soalan · kelajuan automatik</span></div>
          </div>
        ) : (
          <>
            {usesNumberPicker && <div className="mz-setup-section">
              <div className="mz-section-heading"><span>01</span><div><h2>Pilih nombor sifir</h2><p>Choose the multiplication tables for this lesson.</p></div></div>
              <NumberPicker engine={engine} selectedNumbers={selectedNumbers} onToggleNumber={onToggleNumber} onSelectAll={onSelectAll} onClearAll={onClearAll} />
            </div>}
            <div className="mz-setup-options">
              <div className="mz-setup-section mz-option-section">
                <div className="mz-section-heading"><span>{difficultyStep}</span><div><h2>Kelajuan zombie</h2><p>Difficulty changes movement pressure.</p></div></div>
                <div className="mz-choice-row">
                  {DIFFICULTIES.map((level) => (
                    <button className={`mz-choice-card ${difficulty === level ? "is-selected" : ""}`} type="button" key={level} onClick={() => onDifficulty(level)} aria-pressed={difficulty === level}>
                      <strong>{DIFFICULTY_INFO[level].label}</strong><span>{DIFFICULTY_INFO[level].english}</span><em>{level === "easy" ? "Bernafas" : level === "medium" ? "Pantas" : "Laju"}</em>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mz-setup-section mz-option-section">
                <div className="mz-section-heading"><span>{questionCountStep}</span><div><h2>Bilangan soalan</h2><p>Questions per session.</p></div></div>
                <div className="mz-count-row">
                  {QUESTION_COUNTS.map((count) => <button className={questionCount === count ? "is-selected" : ""} type="button" key={count} onClick={() => onQuestionCount(count)} aria-pressed={questionCount === count}>{count}<small>soalan</small></button>)}
                </div>
              </div>
            </div>
          </>
        )}

        {error && <p className="mz-error" role="alert">{error}</p>}
        <button className="mz-start-button" type="button" onClick={onStart} disabled={startDisabled}><Sparkles size={22} /> {startDisabled ? (mode === "student" ? "Memuat analisis... / Loading analysis..." : "Pilih nombor dahulu") : copy.start} <ChevronRight size={21} /></button>
      </section>
    </main>
  );
}

function GameSummary({ mode, operationInfo, summary, weakFacts, saveState, onReplay, onBack }) {
  const accuracy = summary.answered ? Math.round((summary.correct / summary.answered) * 100) : 0;
  return (
    <main className="mz-page mz-summary-page">
      <section className="mz-summary-card">
        <div className={`mz-summary-icon ${summary.reason === "brain" ? "is-danger" : ""}`}>{summary.reason === "brain" ? "🧠" : "🏆"}</div>
        <span className="mz-eyebrow">{summary.reason === "brain" ? "Zombie sampai! / Game over" : "Sesi tamat / Session complete"}</span>
        <h1>{summary.reason === "brain" ? "Cuba lagi, pelindung!" : "Hebat! Otak selamat!"}</h1>
        <p className="mz-summary-lead">{summary.correct} betul daripada {summary.answered} soalan · {accuracy}% tepat</p>
        <div className="mz-summary-stats">
          <div><strong>{summary.correct}</strong><span>Betul / Correct</span></div>
          <div><strong>{summary.wrong}</strong><span>Salah / Wrong</span></div>
          <div><strong>{summary.waves}</strong><span>Zombie ditewaskan</span></div>
        </div>

        <div className="mz-weak-panel">
          <div><h2>Fakta untuk terus berlatih</h2><p>Weak facts to practise next.</p></div>
          {weakFacts.length ? <div className="mz-weak-list">{weakFacts.slice(0, 5).map(({ fact, stat, accuracy: factScore }) => <div key={fact.key}><strong>{factExpression(fact, operationInfo)}</strong><span>{Math.round(factScore * 100)}% tepat · {stat.attempts} cubaan</span></div>)}</div> : <p className="mz-empty-report">Teruskan bermain untuk membina analisis fakta.</p>}
        </div>
        <p className={`mz-save-status ${saveState.kind}`} role="status">{saveState.text}</p>
        <div className="mz-summary-actions">
          <button className="mz-start-button" type="button" onClick={onReplay}><RotateCcw size={20} /> Main lagi</button>
          <button className="mz-secondary-button" type="button" onClick={onBack}><ArrowLeft size={18} /> Kembali</button>
        </div>
      </section>
    </main>
  );
}

export default function MultiplicationZombieGame({ initialMode = "student", initialOperation = "darab", assessmentMode = false, onComplete }) {
  const mode = initialMode === "teacher" ? "teacher" : "student";
  const operation = OPERATION_KEYS.includes(initialOperation) ? initialOperation : "darab";
  const engine = useMemo(() => createOperationEngine(operation), [operation]);
  const operationInfo = engine.info;
  const student = mode === "student" ? getActiveStudent() : null;
  const [phase, setPhase] = useState("setup");
  const [selectedNumbers, setSelectedNumbers] = useState(buildInitialNumberSelection);
  const selectedKeys = useMemo(() => engine.operation === "darab"
    ? selectedKeysForNumbers(engine, selectedNumbers)
    : new Set(engine.factKeys), [engine, selectedNumbers]);
  const [difficulty, setDifficulty] = useState(mode === "student" ? "easy" : "medium");
  const [questionCount, setQuestionCount] = useState(mode === "student" ? 15 : 15);
  const [question, setQuestion] = useState(null);
  const [answerInput, setAnswerInput] = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [lastAction, setLastAction] = useState(null);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState({ kind: "pending", text: "" });
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(() => operation === "darab"
    ? loadMultiplicationProgress(student)
    : loadZombieDefenseProgress(engine, student, operation));
  const [progressReady, setProgressReady] = useState(() => mode !== "student" || !student?.id || student?.isGuest || operation !== "darab");
  const progressRef = useRef(progress);
  const sessionRef = useRef({ sessionId: "", answered: 0, correct: 0, wrong: 0, waves: 0, consecutiveCorrect: 0, consecutiveWrong: 0, currentDifficulty: mode === "student" ? "easy" : "medium", outcomes: [], startedAt: 0, finished: false });
  const submissionLockedRef = useRef(false);
  const zombieHitsRef = useRef(0);
  const currentQuestionRef = useRef(null);
  const phaseRef = useRef(phase);
  const timersRef = useRef([]);
  const actionIdRef = useRef(0);
  const toneAudioRef = useRef(null);
  const bgmRef = useRef(null);
  const studentId = student?.id || null;

  phaseRef.current = phase;
  progressRef.current = progress;
  currentQuestionRef.current = question;

  useEffect(() => {
    if (mode !== "teacher") return undefined;
    let cancelled = false;
    whenAuthReady().then(() => {
      if (!cancelled && !getActiveAdult()) window.location.replace("/cikgu");
    });
    return () => { cancelled = true; };
  }, [mode]);

  useEffect(() => {
    if (mode !== "student" || !studentId || student?.isGuest || operation !== "darab") return undefined;
    let cancelled = false;
    setProgressReady(false);
    loadMultiplicationReport(studentId).then((rows) => {
      if (cancelled || !rows.length) return;
      const remote = Object.fromEntries(rows.map(({ key, ...stat }) => [key, stat]));
      const merged = mergeMultiplicationProgress(progressRef.current, remote);
      progressRef.current = merged;
      setProgress(merged);
    }).catch(() => {
      // Local progress remains available when the report is offline.
    }).finally(() => {
      if (!cancelled) setProgressReady(true);
    });
    return () => { cancelled = true; };
  }, [mode, operation, student?.isGuest, studentId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const audio = new Audio("/audio/villatic_music-zombie-256804.mp3");
    audio.loop = true;
    audio.volume = 0.24;
    bgmRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      bgmRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    if (phase === "playing" && soundOn) {
      const attempt = audio.play();
      attempt?.catch?.(() => {
        // Browser autoplay policy or a missing optional asset must not block play.
      });
    } else {
      audio.pause();
    }
  }, [phase, soundOn]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    if (toneAudioRef.current) toneAudioRef.current.close?.();
    if (bgmRef.current) bgmRef.current.pause();
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((item) => item !== timer);
      callback();
    }, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const chooseNextQuestion = useCallback((nextProgress, previousKey = null) => {
    const config = engine.createSessionConfig({ mode, selectedKeys: [...selectedKeys], difficulty: sessionRef.current.currentDifficulty, questionCount });
    const next = engine.selectNextFact({ mode, progress: nextProgress, selectedKeys: config.selectedKeys, difficulty: config.difficulty, previousKey });
    setQuestion(next);
    currentQuestionRef.current = next;
    setAnswerInput("");
    return next;
  }, [engine, mode, questionCount, selectedKeys]);

  const finishSession = useCallback(async (reason = "complete") => {
    if (sessionRef.current.finished) return;
    sessionRef.current.finished = true;
    phaseRef.current = "summary";
    setPhase("summary");
    playTone(toneAudioRef, reason === "brain" ? "gameover" : "complete", soundOn);
    const session = sessionRef.current;
    const finalProgress = progressRef.current;
    const sessionSummary = {
      mode,
      operation,
      questionCount: mode === "student" ? 15 : questionCount,
      answered: session.answered,
      correct: session.correct,
      wrong: session.wrong,
      waves: session.waves,
      difficultyStart: mode === "student" ? "easy" : difficulty,
      difficultyEnd: session.currentDifficulty,
      reason,
      startedAt: new Date(session.startedAt || Date.now()).toISOString(),
      endedAt: new Date().toISOString(),
      sessionId: session.sessionId
    };
    setSummary(sessionSummary);
    if (assessmentMode && mode === "student" && studentId) {
      void persistStudentAssessment({
        studentId,
        subject: "math",
        skillId: operation,
        score: session.correct,
        total: sessionSummary.questionCount
      });
    }
    const notifyMissionComplete = () => {
      if (mode === "student" && operation === "darab" && reason === "complete") onComplete?.();
    };
    if (!studentId) {
      setSaveState({ kind: "local", text: "Sesi ini sudah selesai. / Session complete." });
      notifyMissionComplete();
      return;
    }
    const savePayload = {
      studentId,
      operation,
      progress: finalProgress,
      factDeltas: engine.factDeltasFromOutcomes(session.outcomes),
      outcomes: session.outcomes,
      summary: sessionSummary
    };
    if (operation !== "darab") {
      saveZombieDefenseSession({ engine, studentId, operation, progress: finalProgress, outcomes: session.outcomes, summary: sessionSummary });
      setSaveState({ kind: "local", text: "Sesi disimpan pada peranti ini. / Session saved on this device." });
      notifyMissionComplete();
      return;
    }
    setSaveState({ kind: "saving", text: "Menyimpan analisis fakta... / Saving fact analysis..." });
    const result = await persistMultiplicationSession(savePayload);
    if (!result.ok) {
      setSaveState({ kind: "offline", text: "Tidak dapat menyimpan pada peranti ini. / Could not save on this device." });
    } else if (result.localOnly) {
      setSaveState({ kind: "offline", text: "Disimpan pada peranti ini sahaja. / Saved on this device only." });
    } else {
      setSaveState({ kind: "saved", text: "Analisis disimpan dalam Firebase. / Analysis saved in Firebase." });
    }
    notifyMissionComplete();
  }, [difficulty, engine, mode, onComplete, operation, questionCount, soundOn, studentId]);

  const startSession = useCallback(() => {
    if (mode === "student" && !progressReady) return;
    if (mode === "teacher" && operation === "darab" && selectedKeys.size === 0) {
      setError(`Pilih sekurang-kurangnya satu nombor ${operationInfo.label.toLowerCase()} dahulu.`);
      return;
    }
    const startingProgress = mode === "student"
      ? progressRef.current
      : (operation === "darab" ? loadMultiplicationProgress(student) : loadZombieDefenseProgress(engine, student, operation));
    const startingDifficulty = mode === "student" ? "easy" : difficulty;
    const config = engine.createSessionConfig({ mode, selectedKeys: [...selectedKeys], difficulty: startingDifficulty, questionCount });
    const firstQuestion = engine.selectNextFact({ mode, progress: startingProgress, selectedKeys: config.selectedKeys, difficulty: config.difficulty });
    if (!firstQuestion) {
      setError("Tiada fakta tersedia untuk sesi ini.");
      return;
    }
    progressRef.current = startingProgress;
    setProgress(startingProgress);
    sessionRef.current = { sessionId: `zd-${operation}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, answered: 0, correct: 0, wrong: 0, waves: 0, consecutiveCorrect: 0, consecutiveWrong: 0, currentDifficulty: startingDifficulty, outcomes: [], startedAt: Date.now(), finished: false };
    submissionLockedRef.current = false;
    zombieHitsRef.current = 0;
    setQuestion(firstQuestion);
    currentQuestionRef.current = firstQuestion;
    setAnswerInput("");
    setAnsweredCount(0);
    setCorrect(0);
    setWrong(0);
    setLastAction(null);
    setSummary(null);
    setSaveState({ kind: "pending", text: "" });
    setError("");
    setPhase("playing");
    if (soundOn && bgmRef.current) {
      // Start during the button gesture, before browser autoplay permission expires.
      bgmRef.current.currentTime = 0;
      bgmRef.current.play()?.catch?.(() => {});
    }
  }, [difficulty, engine, mode, operation, operationInfo.label, progressReady, questionCount, selectedKeys, soundOn, student]);

  const moveToNextQuestion = useCallback(() => {
    if (phaseRef.current !== "playing" || sessionRef.current.finished) return;
    if (sessionRef.current.answered >= (mode === "student" ? 15 : questionCount)) {
      finishSession("complete");
      return;
    }
    chooseNextQuestion(progressRef.current, currentQuestionRef.current?.key || null);
  }, [chooseNextQuestion, finishSession, mode, questionCount]);

  const submitAnswer = useCallback(() => {
    if (phaseRef.current !== "playing" || sessionRef.current.finished || submissionLockedRef.current) return;
    const current = currentQuestionRef.current;
    const value = answerInput.trim();
    if (!current || !value || !/^\d{1,3}$/.test(value)) return;

    const isCorrect = Number(value) === current.answer;
    submissionLockedRef.current = true;
    const session = sessionRef.current;
    const now = Date.now();
    const nextProgress = engine.recordFactOutcome(progressRef.current, current.key, isCorrect, now);
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    session.answered += 1;
    session.outcomes.push({ factKey: current.key, correct: isCorrect });
    if (isCorrect) {
      session.correct += 1;
      zombieHitsRef.current += 1;
      session.consecutiveCorrect += 1;
      session.consecutiveWrong = 0;
    } else {
      session.wrong += 1;
      session.consecutiveWrong += 1;
      session.consecutiveCorrect = 0;
    }
    if (mode === "student") session.currentDifficulty = getNextDifficulty(session.currentDifficulty, session);
    setAnsweredCount(session.answered);
    setCorrect(session.correct);
    setWrong(session.wrong);
    setDifficulty(session.currentDifficulty);
    setLastAction({ id: actionIdRef.current += 1, correct: isCorrect });
    setAnswerInput("");
    playTone(toneAudioRef, isCorrect ? "correct" : "wrong", soundOn);

    const total = mode === "student" ? 15 : questionCount;
    const answerDelay = isCorrect && zombieHitsRef.current >= 3 ? 1350 : isCorrect ? 820 : 260;
    if (session.answered >= total) {
      schedule(() => finishSession("complete"), answerDelay);
      return;
    }
    schedule(() => {
      submissionLockedRef.current = false;
      moveToNextQuestion();
    }, answerDelay);
  }, [answerInput, engine, finishSession, mode, moveToNextQuestion, questionCount, schedule, soundOn]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const handleKey = (event) => {
      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        setAnswerInput((value) => value.length >= 3 ? value : `${value}${event.key}`);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setAnswerInput((value) => value.slice(0, -1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        submitAnswer();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, submitAnswer]);

  const gameState = useMemo(() => ({
    phase,
    sessionId: sessionRef.current.sessionId,
    difficulty: sessionRef.current.currentDifficulty,
    operation,
    operationInfo,
    question,
    answeredCount,
    questionCount: mode === "student" ? 15 : questionCount,
    action: lastAction
  }), [answeredCount, lastAction, mode, operation, operationInfo, phase, question, questionCount]);

  const toggleNumber = (number) => {
    setSelectedNumbers((current) => {
      const next = new Set(current);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };

  const weakFacts = useMemo(() => engine.getWeakFacts(progress), [engine, progress]);

  if (phase === "setup") {
    return <SetupPanel mode={mode} engine={engine} selectedNumbers={selectedNumbers} difficulty={difficulty} questionCount={questionCount} onToggleNumber={toggleNumber} onSelectAll={() => setSelectedNumbers(selectAllNumbers())} onClearAll={() => setSelectedNumbers(new Set())} onDifficulty={setDifficulty} onQuestionCount={setQuestionCount} onStart={startSession} error={error} startDisabled={mode === "student" ? !progressReady : operation === "darab" && selectedKeys.size === 0} />;
  }

  if (phase === "summary" && summary) {
    return <GameSummary mode={mode} operationInfo={operationInfo} summary={summary} weakFacts={weakFacts} saveState={saveState} onReplay={startSession} onBack={() => setPhase("setup")} />;
  }

  return (
    <main className="mz-page mz-game-page">
      <header className="mz-game-header">
        <a className="mz-back-link" href={mode === "teacher" ? "/cikgu/mengajar" : "/murid/matematik"}><ArrowLeft size={18} /> Kembali</a>
        <div className="mz-game-brand"><span>🧟</span><strong>Zombie Defense</strong><small>{operationInfo.label} / {operationInfo.english}</small></div>
        <button className="mz-sound-button" type="button" onClick={() => setSoundOn((value) => !value)} aria-label={soundOn ? "Matikan bunyi" : "Hidupkan bunyi"}>{soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
      </header>
      <div className="mz-game-shell">
        <section className="mz-stage-panel">
          <ZombieCanvas state={gameState} onBrainReached={() => finishSession("brain")} onZombieDefeated={() => { sessionRef.current.waves += 1; zombieHitsRef.current = 0; }} />
          <div className="mz-stage-caption"><span><Shield size={15} /> {mode === "student" ? "Fakta dipilih untuk kamu" : operation === "darab" ? `${selectedNumbers.size} nombor dipilih` : `Semua fakta ${operationInfo.label.toLowerCase()}`}</span><span><Zap size={15} /> {mode === "student" ? "Kelajuan automatik" : DIFFICULTY_INFO[difficulty].label}</span></div>
        </section>
        <aside className="mz-answer-panel">
          <div className="mz-answer-heading"><span>Jawapan kamu / Your answer</span><strong>{question ? factExpression(question, operationInfo).replace(` = ${question.answer}`, " = ?") : "—"}</strong></div>
          <div className="mz-answer-display" aria-live="polite">{answerInput || <span>?</span>}</div>
          <Keypad value={answerInput} onInput={(value) => setAnswerInput((current) => current.length >= 3 ? current : `${current}${value}`)} onDelete={() => setAnswerInput((value) => value.slice(0, -1))} onSubmit={submitAnswer} disabled={phase !== "playing"} />
          <div className="mz-live-stats"><div><strong>{correct}</strong><span>Betul</span></div><div><strong>{wrong}</strong><span>Salah</span></div><div><strong>{Math.max(0, (mode === "student" ? 15 : questionCount) - answeredCount)}</strong><span>Menunggu</span></div></div>
          <p className="mz-keyboard-hint">Tip: taip nombor pada papan kekunci atau tekan Enter untuk menyerang.</p>
        </aside>
      </div>
    </main>
  );
}
