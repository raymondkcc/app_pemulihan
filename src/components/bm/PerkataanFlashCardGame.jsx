import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Layers3,
  RefreshCcw,
  RotateCcw,
  Shuffle,
  SpellCheck2,
  Volume2,
  X
} from "lucide-react";
import { PERKATAAN_SKILLS } from "../../data/perkataan.js";

const MODES = {
  wordToImage: {
    label: "Perkataan ke gambar",
    shortLabel: "Perkataan -> Gambar",
    prompt: "Bayangkan gambarnya, kemudian buka kad.",
    Icon: SpellCheck2
  },
  imageToWord: {
    label: "Gambar ke perkataan",
    shortLabel: "Gambar -> Perkataan",
    prompt: "Sebut perkataannya, kemudian buka kad.",
    Icon: ImageIcon
  }
};

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function buildDeck() {
  const seen = new Set();
  return PERKATAAN_SKILLS.flatMap((skill) =>
    [...(skill.practice || []), ...(skill.words || [])].map((word) => ({
      word,
      skill: skill.code,
      skillTitle: skill.title
    }))
  ).filter(({ word }) => {
    const key = word.toLocaleLowerCase("ms");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function WordPicture({ word }) {
  const [extensionIndex, setExtensionIndex] = useState(0);
  const extensions = ["png", "svg", "jpg"];

  useEffect(() => setExtensionIndex(0), [word]);

  if (extensionIndex >= extensions.length) {
    return <ImageIcon className="flash-card-image-fallback" size={70} aria-label="Gambar tidak tersedia" />;
  }

  return (
    <img
      src={`/images/perkataan/${word}.${extensions[extensionIndex]}`}
      alt={word}
      onError={() => setExtensionIndex((current) => current + 1)}
    />
  );
}

function playWord(word) {
  const audio = new Audio(`/audio/perkataan/${word}.mp3`);
  audio.play().catch(() => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "ms-MY";
    utterance.rate = 0.72;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export default function PerkataanFlashCardGame({ onBack }) {
  const allWords = useMemo(buildDeck, []);
  const [mode, setMode] = useState("wordToImage");
  const [deck, setDeck] = useState(() => shuffle(buildDeck()));
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [scores, setScores] = useState({ remembered: 0, retry: 0 });
  const [round, setRound] = useState(1);
  const advanceTimer = useRef(null);

  const card = deck[cardIndex];
  const totalAnswered = scores.remembered + scores.retry;
  const progress = deck.length ? ((cardIndex + 1) / deck.length) * 100 : 0;
  const modeDetails = MODES[mode];

  function resetDeck(nextMode = mode) {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setMode(nextMode);
    setDeck(shuffle(allWords));
    setCardIndex(0);
    setIsFlipped(false);
    setIsAdvancing(false);
    setScores({ remembered: 0, retry: 0 });
    setRound(1);
  }

  function changeMode(nextMode) {
    if (nextMode !== mode) resetDeck(nextMode);
  }

  function moveToNextCard(result) {
    if (!isFlipped || isAdvancing) return;

    setScores((current) => ({ ...current, [result]: current[result] + 1 }));
    setIsFlipped(false);
    setIsAdvancing(true);

    advanceTimer.current = window.setTimeout(() => {
      if (cardIndex === deck.length - 1) {
        setDeck(shuffle(allWords));
        setCardIndex(0);
        setRound((current) => current + 1);
      } else {
        setCardIndex((current) => current + 1);
      }
      advanceTimer.current = null;
      setIsAdvancing(false);
    }, 220);
  }

  function handleCardKeyDown(event) {
    if (isAdvancing) return;
    if (event.code === "Space") {
      event.preventDefault();
      setIsFlipped((current) => !current);
    }
    if (isFlipped && event.key === "ArrowLeft") {
      event.preventDefault();
      moveToNextCard("retry");
    }
    if (isFlipped && event.key === "ArrowRight") {
      event.preventDefault();
      moveToNextCard("remembered");
    }
  }

  useEffect(() => () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.target instanceof HTMLButtonElement || isAdvancing) return;
      if (event.code === "Space") {
        event.preventDefault();
        setIsFlipped((current) => !current);
      }
      if (isFlipped && event.key === "ArrowLeft") moveToNextCard("retry");
      if (isFlipped && event.key === "ArrowRight") moveToNextCard("remembered");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdvancing, isFlipped]);

  if (!card) return null;

  const frontIsWord = mode === "wordToImage";

  return (
    <div className="home-content hub-content flash-game-content">
      <header className="flash-game-header">
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke Perkataan">
          <ArrowLeft size={18} /> <span>Perkataan</span>
        </button>
          <div className="flash-game-title">
            <span><Layers3 size={16} /> Kad imbas</span>
            <h1>Ulang kaji kad imbas</h1>
            <p>{allWords.length} perkataan dalam satu koleksi.</p>
          </div>
        <button className="flash-reset-button" type="button" onClick={() => resetDeck()} title="Mula semula">
          <RefreshCcw size={17} /> <span>Mula semula</span>
        </button>
      </header>

      <div className="flash-mode-switch" role="group" aria-label="Pilih cara bermain">
        {Object.entries(MODES).map(([id, details]) => {
          const Icon = details.Icon;
          return (
            <button
              key={id}
              type="button"
              className={mode === id ? "is-active" : ""}
              aria-pressed={mode === id}
              onClick={() => changeMode(id)}
            >
              <Icon size={18} /> {details.shortLabel}
            </button>
          );
        })}
      </div>

      <section className="flash-game-stage" aria-labelledby="flash-mode-title">
        <div className="flash-status-row">
          <div>
            <span className="flash-round">Pusingan {round}</span>
            <strong id="flash-mode-title">{modeDetails.label}</strong>
          </div>
          <span className="flash-position">{cardIndex + 1} / {deck.length}</span>
        </div>

        <div className="flash-progress" aria-label={`${cardIndex + 1} daripada ${deck.length} kad`}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <p className="flash-prompt">{isFlipped ? "Semak jawapan kamu." : modeDetails.prompt}</p>

        <button
          className={`flash-card ${isFlipped ? "is-flipped" : ""}`}
          type="button"
          onKeyDown={handleCardKeyDown}
          onClick={() => {
            if (!isAdvancing) setIsFlipped((current) => !current);
          }}
          aria-label={isFlipped ? "Tutup jawapan" : "Buka jawapan"}
        >
          <span className="flash-card-inner">
            <span className={`flash-card-face flash-card-front ${frontIsWord ? "is-word" : "is-picture"}`}>
              <span className="flash-card-skill">{card.skill} · {card.skillTitle}</span>
              {frontIsWord ? (
                <strong>{card.word}</strong>
              ) : (
                <span className="flash-card-picture"><WordPicture word={card.word} /></span>
              )}
              <span className="flash-card-turn"><RotateCcw size={15} /> Buka kad</span>
            </span>
            <span className={`flash-card-face flash-card-back ${frontIsWord ? "is-picture" : "is-word"}`}>
              <span className="flash-card-skill">Jawapan</span>
              {frontIsWord ? (
                <span className="flash-card-picture"><WordPicture word={card.word} /></span>
              ) : (
                <strong>{card.word}</strong>
              )}
              <span className="flash-card-turn"><RotateCcw size={15} /> Tutup kad</span>
            </span>
          </span>
        </button>

        <div className="flash-audio-row">
          <button type="button" disabled={isAdvancing} onClick={() => playWord(card.word)}>
            <Volume2 size={19} /> Dengar perkataan
          </button>
        </div>

        <div className="flash-answer-actions">
          <button type="button" className="flash-retry" disabled={!isFlipped || isAdvancing} onClick={() => moveToNextCard("retry")}>
            <X size={20} /> Belum ingat
          </button>
          <button type="button" className="flash-remembered" disabled={!isFlipped || isAdvancing} onClick={() => moveToNextCard("remembered")}>
            <Check size={20} /> Sudah ingat
          </button>
        </div>

        <div className="flash-scoreboard" aria-label="Skor sesi">
          <span><Check size={16} /><strong>{scores.remembered}</strong> sudah ingat</span>
          <span><X size={16} /><strong>{scores.retry}</strong> belum ingat</span>
          <span><Shuffle size={16} /><strong>{totalAnswered}</strong> dijawab</span>
        </div>
      </section>
    </div>
  );
}
