import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Image as ImageIcon,
  ListChecks,
  RefreshCcw,
  Trophy,
  Volume2,
  X
} from "lucide-react";
import { PERKATAAN_SKILLS } from "../../data/perkataan.js";
import { splitMalaySyllables } from "../../utils/malaySyllables.js";

const QUIZ_MODES = {
  wordToImage: {
    label: "Perkataan ke gambar",
    shortLabel: "Perkataan -> Gambar",
    prompt: "Pilih gambar yang betul untuk perkataan ini.",
    Icon: ListChecks
  },
  imageToWord: {
    label: "Gambar ke perkataan",
    shortLabel: "Gambar -> Perkataan",
    prompt: "Pilih perkataan yang betul untuk gambar ini.",
    Icon: ImageIcon
  }
};

const QUIZ_SOUND_PATHS = {
  success: "/audio/quiz/success.mp3",
  fail: "/audio/quiz/fail.mp3"
};

const MAX_RETRIES = 3;
const CORRECT_ADVANCE_DELAY = 650;
const WRONG_ADVANCE_DELAY = 700;
const quizWordAudioCache = new Map();

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function wordsForSkill(skill) {
  return [...(skill.practice || []), ...(skill.words || [])].filter(
    (word, index, words) => words.indexOf(word) === index
  );
}

const ALL_WORDS = Array.from(new Set(PERKATAAN_SKILLS.flatMap(wordsForSkill)));

function createQuestions(skill) {
  const words = wordsForSkill(skill);
  return shuffle(words).map((word) => ({
    word,
    retryCount: 0,
    choices: shuffle([
      word,
      ...shuffle([
        ...words.filter((candidate) => candidate !== word),
        ...ALL_WORDS.filter((candidate) => !words.includes(candidate))
      ]).slice(0, 3)
    ])
  }));
}

function getQuizWordAudio(word) {
  const cached = quizWordAudioCache.get(word);
  if (cached) return cached;

  const audio = new window.Audio();
  audio.preload = "auto";
  audio.src = `/audio/perkataan/${encodeURIComponent(word)}.mp3`;

  const ready = new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      settle(reject, new Error(`Audio mengambil masa terlalu lama untuk ${word}`));
    }, 10000);
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      audio.removeEventListener("canplay", handleReady);
      audio.removeEventListener("canplaythrough", handleReady);
      audio.removeEventListener("loadeddata", handleReady);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("abort", handleError);
    };
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };
    const handleReady = () => {
      if (audio.readyState >= 4) settle(resolve, audio);
    };
    const handleError = () => settle(reject, new Error(`Audio tidak tersedia untuk ${word}`));

    audio.addEventListener("canplay", handleReady);
    audio.addEventListener("canplaythrough", handleReady);
    audio.addEventListener("loadeddata", handleReady);
    audio.addEventListener("error", handleError);
    audio.addEventListener("abort", handleError);
    audio.load();
    handleReady();
  });

  const entry = { audio, ready };
  quizWordAudioCache.set(word, entry);
  return entry;
}

function WordPicture({ word, alt = "" }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return <ImageIcon className="quiz-picture-fallback" size={44} aria-label="Gambar tidak tersedia" />;
  }

  return (
    <img
      src={`/images/perkataan/${word}.png`}
      alt={alt}
      onError={() => setImageFailed(true)}
    />
  );
}

function SyllableWord({ word, color = "coral", activeSyllableIndex = -1 }) {
  return (
    <strong className="word-syllable-text">
      {splitMalaySyllables(word).map((syllable, index) => (
        <span
          key={`${syllable}-${index}`}
          className={`syllable-part syllable-${index % 2 === 0 ? "first" : "second"} syllable-color-${color} ${index === activeSyllableIndex ? "syllable-active" : ""}`}
        >
          {syllable}
        </span>
      ))}
    </strong>
  );
}

function playQuizSound(type) {
  const source = QUIZ_SOUND_PATHS[type];
  if (!source || !window.Audio) return;

  const audio = new window.Audio(source);
  audio.volume = 0.7;
  audio.play().catch(() => {});
}

function ModeSwitch({ mode, onChange }) {
  return (
    <div className="quiz-mode-switch" role="group" aria-label="Pilih cara menjawab">
      {Object.entries(QUIZ_MODES).map(([id, details]) => {
        const Icon = details.Icon;
        return (
      <button
            key={id}
            type="button"
            className={mode === id ? "is-active" : ""}
            aria-pressed={mode === id}
            onClick={() => onChange(id)}
          >
            <Icon size={18} /> {details.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export default function PerkataanQuizGame({ onBack }) {
  const skills = useMemo(() => PERKATAAN_SKILLS.map((skill) => ({
    ...skill,
    quizWords: wordsForSkill(skill)
  })), []);
  const [mode, setMode] = useState("wordToImage");
  const [status, setStatus] = useState("skills");
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [scores, setScores] = useState({ correct: 0, wrong: 0 });
  const [completedCount, setCompletedCount] = useState(0);
  const [audioStatus, setAudioStatus] = useState("idle");
  const [audioError, setAudioError] = useState(false);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState(-1);
  const advanceTimer = useRef(null);
  const audioEntryRef = useRef(null);
  const activeAudioRef = useRef(null);
  const removeAudioListenersRef = useRef(() => {});
  const fallbackTimersRef = useRef([]);

  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) || null;
  const question = questions[0] || null;
  const modeDetails = QUIZ_MODES[mode];
  const answered = selectedAnswer !== null;
  const isCorrect = answered && selectedAnswer === question?.word;
  const totalWords = selectedSkill?.quizWords.length || 0;
  const questionNumber = totalWords ? Math.min(completedCount + 1, totalWords) : 0;
  const progress = totalWords ? (completedCount / totalWords) * 100 : 0;

  function clearAdvanceTimer() {
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }

  function clearFallbackTimers() {
    fallbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    fallbackTimersRef.current = [];
  }

  function stopWordAudio() {
    clearFallbackTimers();
    removeAudioListenersRef.current();
    removeAudioListenersRef.current = () => {};
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setActiveSyllableIndex(-1);
  }

  function finishWordAudio(audio = null) {
    if (audio && activeAudioRef.current !== audio) return;
    clearFallbackTimers();
    removeAudioListenersRef.current();
    removeAudioListenersRef.current = () => {};
    activeAudioRef.current = null;
    setAudioStatus("ready");
    setActiveSyllableIndex(-1);
  }

  function speakWithFallback(word) {
    clearFallbackTimers();
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setAudioStatus("ready");
      setActiveSyllableIndex(-1);
      return;
    }

    const syllables = splitMalaySyllables(word);
    const utterance = new window.SpeechSynthesisUtterance(word);
    utterance.lang = "ms-MY";
    utterance.rate = 0.72;
    utterance.onstart = () => {
      setAudioStatus("playing");
      setActiveSyllableIndex(0);
      syllables.slice(1).forEach((_, index) => {
        fallbackTimersRef.current.push(window.setTimeout(
          () => setActiveSyllableIndex(index + 1),
          (index + 1) * 430
        ));
      });
    };
    utterance.onend = () => finishWordAudio();
    utterance.onerror = () => finishWordAudio();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function playWord(word) {
    const entry = audioEntryRef.current;
    if (!entry || audioStatus === "loading" || audioStatus === "playing") return;

    clearFallbackTimers();
    if (audioError) {
      speakWithFallback(word);
      return;
    }
    removeAudioListenersRef.current();
    removeAudioListenersRef.current = () => {};
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
    }

    const audio = entry.audio;
    const syllables = splitMalaySyllables(word);
    let fallbackStarted = false;
    const startFallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      activeAudioRef.current = null;
      setAudioError(true);
      speakWithFallback(word);
    };
    const handleTimeUpdate = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const nextIndex = Math.min(
        syllables.length - 1,
        Math.floor((audio.currentTime / audio.duration) * syllables.length)
      );
      setActiveSyllableIndex(Math.max(0, nextIndex));
    };
    const handleEnded = () => finishWordAudio(audio);
    const handlePause = () => {
      if (!audio.ended && activeAudioRef.current === audio) finishWordAudio(audio);
    };
    const handleError = () => {
      removeAudioListenersRef.current();
      removeAudioListenersRef.current = () => {};
      startFallback();
    };

    removeAudioListenersRef.current = () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);
    audio.currentTime = 0;
    activeAudioRef.current = audio;
    setAudioStatus("playing");
    setActiveSyllableIndex(0);
    audio.play().catch(startFallback);
  }

  useEffect(() => {
    if (!question || status !== "playing") return undefined;

    stopWordAudio();
    setAudioStatus("loading");
    setAudioError(false);
    const entry = getQuizWordAudio(question.word);
    audioEntryRef.current = entry;
    let cancelled = false;

    entry.ready
      .then(() => {
        if (cancelled || audioEntryRef.current !== entry) return;
        setAudioStatus("ready");
      })
      .catch(() => {
        if (cancelled || audioEntryRef.current !== entry) return;
        setAudioError(true);
        setAudioStatus("ready");
      });

    return () => {
      cancelled = true;
      if (audioEntryRef.current === entry) audioEntryRef.current = null;
      stopWordAudio();
    };
  }, [question?.word, question?.retryCount, status, mode]);

  useEffect(() => () => {
    clearAdvanceTimer();
    stopWordAudio();
  }, []);

  function startSkill(skillId) {
    const skill = skills.find((item) => item.id === skillId);
    if (!skill) return;

    setSelectedSkillId(skillId);
    setQuestions(createQuestions(skill));
    setSelectedAnswer(null);
    setScores({ correct: 0, wrong: 0 });
    setCompletedCount(0);
    setStatus("playing");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function changeMode(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    if (selectedSkill && status !== "skills") {
      clearAdvanceTimer();
      stopWordAudio();
      setQuestions(createQuestions(selectedSkill));
      setSelectedAnswer(null);
      setScores({ correct: 0, wrong: 0 });
      setCompletedCount(0);
      setStatus("playing");
    }
  }

  function chooseAnswer(answer) {
    if (status !== "playing" || answered || !question) return;
    const correct = answer === question.word;
    playQuizSound(correct ? "success" : "fail");
    setSelectedAnswer(answer);
    setScores((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      wrong: current.wrong + (correct ? 0 : 1)
    }));

    const isFinalRetry = !correct && question.retryCount >= MAX_RETRIES;
    if (correct || isFinalRetry) setCompletedCount((current) => current + 1);

    const nextQueue = correct || isFinalRetry
      ? questions.slice(1)
      : [...questions.slice(1), { ...question, retryCount: question.retryCount + 1 }];
    clearAdvanceTimer();
    advanceTimer.current = window.setTimeout(() => {
      setQuestions(nextQueue);
      setSelectedAnswer(null);
      if (nextQueue.length === 0) setStatus("complete");
    }, correct ? CORRECT_ADVANCE_DELAY : WRONG_ADVANCE_DELAY);
  }

  function chooseAnotherSkill() {
    clearAdvanceTimer();
    stopWordAudio();
    setStatus("skills");
    setSelectedSkillId(null);
    setQuestions([]);
    setSelectedAnswer(null);
    setScores({ correct: 0, wrong: 0 });
    setCompletedCount(0);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  if (status === "skills") {
    return (
      <div className="home-content hub-content quiz-game-content">
        <header className="quiz-game-header">
          <button className="back-button" type="button" onClick={onBack} title="Kembali ke Perkataan">
            <ArrowLeft size={18} /> <span>Perkataan</span>
          </button>
          <div className="quiz-game-title">
            <span><ListChecks size={16} /> Kuiz 4 pilihan</span>
            <h1>Main Perkataan</h1>
            <p>Pilih satu kemahiran untuk mula menjawab.</p>
          </div>
          <div className="quiz-game-total"><strong>{skills.length}</strong><span>kemahiran</span></div>
        </header>

        <ModeSwitch mode={mode} onChange={changeMode} />

        <section className="quiz-skill-picker" aria-labelledby="quiz-skill-title">
          <div className="quiz-section-heading">
            <div>
              <span className="quiz-kicker">Pilih kemahiran</span>
              <h2 id="quiz-skill-title">Kemahiran mana hari ini?</h2>
              <p>Setiap kuiz menggunakan perkataan daripada satu kemahiran sahaja.</p>
            </div>
            <span className="quiz-skill-count"><ListChecks size={16} /> 4 pilihan setiap soalan</span>
          </div>
          <div className="quiz-skill-grid" aria-label="Pilih kemahiran perkataan">
            {skills.map((skill, index) => (
              <button
                key={skill.id}
                className={`quiz-skill-card quiz-skill-${skill.color}`}
                type="button"
                onClick={() => startSkill(skill.id)}
              >
                <span className="quiz-skill-number">{String(index + 1).padStart(2, "0")}</span>
                <strong>{skill.code}</strong>
                <span>{skill.title}</span>
                <small>{skill.quizWords.length} perkataan <ChevronRight size={14} /></small>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (status === "complete") {
    const total = totalWords;
    return (
      <div className="home-content hub-content quiz-game-content">
        <header className="quiz-game-header">
          <button className="back-button" type="button" onClick={onBack} title="Kembali ke Perkataan">
            <ArrowLeft size={18} /> <span>Perkataan</span>
          </button>
          <div className="quiz-game-title">
            <span><Trophy size={16} /> Kuiz selesai</span>
            <h1>{selectedSkill?.code} · {selectedSkill?.title}</h1>
            <p>{modeDetails.label}</p>
          </div>
          <button className="quiz-header-action" type="button" onClick={chooseAnotherSkill} title="Pilih kemahiran lain">
            <ListChecks size={17} /> <span>Kemahiran</span>
          </button>
        </header>

        <section className="quiz-result-panel" aria-labelledby="quiz-result-title">
          <span className="quiz-result-icon"><Trophy size={30} /></span>
          <span className="quiz-kicker">Syabas!</span>
          <h2 id="quiz-result-title">Sesi selesai</h2>
          <p><strong>{scores.correct} / {total}</strong> jawapan betul · {scores.wrong} perlu cuba lagi.</p>
          <div className="quiz-result-bar" aria-label={`${scores.correct} daripada ${total} jawapan betul`}>
            <span style={{ width: `${total ? (scores.correct / total) * 100 : 0}%` }} />
          </div>
          <div className="quiz-result-actions">
            <button className="quiz-secondary-action" type="button" onClick={() => startSkill(selectedSkillId)}>
              <RefreshCcw size={17} /> Main lagi
            </button>
            <button className="quiz-primary-action" type="button" onClick={chooseAnotherSkill}>
              <ListChecks size={17} /> Pilih kemahiran
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-content hub-content quiz-game-content">
      <header className="quiz-game-header">
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke Perkataan">
          <ArrowLeft size={18} /> <span>Perkataan</span>
        </button>
        <div className="quiz-game-title">
          <span><ListChecks size={16} /> Kuiz 4 pilihan</span>
          <h1>{selectedSkill.code} · {selectedSkill.title}</h1>
          <p>{modeDetails.label}</p>
        </div>
        <button className="quiz-header-action" type="button" onClick={chooseAnotherSkill} title="Pilih kemahiran lain">
          <ListChecks size={17} /> <span>Kemahiran</span>
        </button>
      </header>

      <ModeSwitch mode={mode} onChange={changeMode} />

      <section className="quiz-question-stage" aria-labelledby="quiz-question-title">
        <div className="quiz-status-row">
          <div>
            <span className="quiz-kicker">{selectedSkill.code} · {selectedSkill.title}</span>
            <strong id="quiz-question-title">Soalan {questionNumber}</strong>
          </div>
          <span className="quiz-position">{questionNumber} / {totalWords}</span>
        </div>

        <div className="quiz-progress" aria-label={`${completedCount} daripada ${totalWords} perkataan selesai`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className={`quiz-question-card quiz-question-${mode}`}>
          <span className="quiz-question-prompt">{modeDetails.prompt}</span>
          {mode === "wordToImage" ? (
            <div className="quiz-word-target">
              <SyllableWord word={question.word} color={selectedSkill.color} activeSyllableIndex={activeSyllableIndex} />
              <button
                type="button"
                className={audioStatus === "playing" ? "is-playing" : ""}
                onClick={() => playWord(question.word)}
                disabled={audioStatus !== "ready"}
                title={audioStatus === "loading"
                  ? "Memuatkan audio"
                  : audioError
                    ? "Audio fail, guna sebutan peranti"
                    : "Dengar perkataan"}
              >
                <Volume2 size={17} /> {audioStatus === "loading" ? "Memuat..." : audioStatus === "playing" ? "Sedang dengar" : "Dengar"}
              </button>
            </div>
          ) : (
            <div className="quiz-picture-target">
              <WordPicture word={question.word} alt={`Gambar untuk soalan ${questionNumber}`} />
              <button
                type="button"
                className={audioStatus === "playing" ? "is-playing" : ""}
                onClick={() => playWord(question.word)}
                disabled={audioStatus !== "ready"}
                title={audioStatus === "loading"
                  ? "Memuatkan audio"
                  : audioError
                    ? "Audio fail, guna sebutan peranti"
                    : "Dengar perkataan"}
              >
                <Volume2 size={17} /> {audioStatus === "loading" ? "Memuat..." : audioStatus === "playing" ? "Sedang dengar" : "Dengar"}
              </button>
            </div>
          )}
        </div>

        <div className={`quiz-options quiz-options-${mode}`} aria-label="Empat pilihan jawapan">
          {question.choices.map((choice, index) => {
            const choiceIsCorrect = isCorrect && choice === question.word;
            const choiceIsWrong = answered && choice === selectedAnswer && choice !== question.word;
            return (
              <button
                key={`${question.word}-${question.retryCount}-${choice}`}
                className={`quiz-option ${choiceIsCorrect ? "is-correct" : ""} ${choiceIsWrong ? "is-wrong" : ""}`}
                type="button"
                onClick={() => chooseAnswer(choice)}
                disabled={answered}
                aria-label={mode === "wordToImage" ? `Pilihan gambar ${index + 1}` : `Pilihan perkataan ${choice}`}
              >
                {mode === "wordToImage" ? (
                  <span className="quiz-option-picture"><WordPicture word={choice} alt={`Gambar pilihan ${index + 1}`} /></span>
                ) : (
                  <strong>{choice}</strong>
                )}
                <span className="quiz-option-number">{index + 1}</span>
                {choiceIsCorrect && <Check className="quiz-option-result" size={19} />}
                {choiceIsWrong && <X className="quiz-option-result" size={19} />}
              </button>
            );
          })}
        </div>

        <div className={`quiz-feedback ${answered ? (isCorrect ? "is-correct" : "is-wrong") : "is-waiting"}`} role="status" aria-live="polite">
          {!answered && <>Pilih satu jawapan.</>}
          {answered && isCorrect && <><Check size={17} /> Betul! Bagus.</>}
          {answered && !isCorrect && <><X size={17} /> Cuba lagi. Soalan ini akan muncul semula.</>}
        </div>

        <div className="quiz-bottom-row">
          <div className="quiz-scoreboard" aria-label="Skor kuiz">
            <span><Check size={15} /><strong>{scores.correct}</strong> betul</span>
            <span><X size={15} /><strong>{scores.wrong}</strong> cuba lagi</span>
          </div>
          <span className="quiz-auto-progress" aria-live="polite">
            {answered ? (isCorrect ? "Seterusnya..." : "Akan diuji lagi...") : "Pilih jawapan"} <ChevronRight size={17} />
          </span>
        </div>
      </section>
    </div>
  );
}
