import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  GripVertical,
  Heart,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X
} from "lucide-react";
import { HURUF } from "../../data/bm.js";

const SOUND_ROUNDS = HURUF.length;
const PAIR_ROUNDS = 3;
const PAIR_AUDIO = {
  lobby: "/audio/huruf/lobby-bgm.mp3",
  pop: "/audio/huruf/pop.mp3",
  mistake: "/audio/huruf/mistake.mp3",
  yay: "/audio/huruf/yay.mp3"
};

const ANIMAL_PAIRS = [
  { id: "bear", mother: "Ibu beruang", cub: "Anak beruang", motherImage: "/images/huruf/animals/bear-mother.png", cubImage: "/images/huruf/animals/bear-cub.png", letter: "B", prompt: "B untuk beruang" },
  { id: "elephant", mother: "Ibu gajah", cub: "Anak gajah", motherImage: "/images/huruf/animals/elephant-mother.png", cubImage: "/images/huruf/animals/elephant-cub.png", letter: "G", prompt: "G untuk gajah" },
  { id: "rabbit", mother: "Ibu arnab", cub: "Anak arnab", motherImage: "/images/huruf/animals/rabbit-mother.png", cubImage: "/images/huruf/animals/rabbit-cub.png", letter: "A", prompt: "A untuk arnab" }
];

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function findLetter(letter) {
  return HURUF.find((item) => item.letter === letter) || HURUF[0];
}

function playLetterAudio(letter, audioRef) {
  const source = `/audio/letters/${letter.toLowerCase()}.mp3`;
  const previousAudio = audioRef.current?.audio;
  const audio = audioRef.current?.source === source ? previousAudio : new window.Audio(source);
  if (previousAudio && previousAudio !== audio) {
    previousAudio.pause();
    previousAudio.currentTime = 0;
  }
  audioRef.current = { source, audio };
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playPairEffect(source) {
  const audio = new window.Audio(source);
  audio.volume = 0.85;
  audio.play().catch(() => {});
}

function GameIntro({ icon, eyebrow, title, description, actionLabel, onStart }) {
  return (
    <div className="huruf-game-intro">
      <span className="huruf-game-intro-icon">{icon}</span>
      <span className="section-kicker">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="primary-mini-action" type="button" onClick={onStart}><Play size={17} fill="currentColor" /> {actionLabel}</button>
    </div>
  );
}

function SoundChoiceGame({ onComplete }) {
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const [status, setStatus] = useState("ready");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [sessionLetters, setSessionLetters] = useState(HURUF);

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    audioRef.current?.audio.pause();
  }, []);

  const target = sessionLetters[round] || HURUF[0];

  function startGame() {
    const nextLetters = shuffle(HURUF);
    setSessionLetters(nextLetters);
    setRound(0);
    setScore(0);
    setFeedback(null);
    setStatus("answering");
    playLetterAudio(nextLetters[0].letter, audioRef);
  }

  function answer(letter) {
    if (status !== "answering" || feedback?.type === "correct") return;
    const correct = letter === target.letter;
    if (!correct) {
      setFeedback({ type: "wrong", text: "Cuba lagi. Dengar bunyi sekali lagi." });
      return;
    }

    const nextScore = score + 1;
    setScore(nextScore);
    setFeedback({ type: "correct", text: `Betul! Ini huruf ${target.letter}.` });
    if (round === SOUND_ROUNDS - 1) {
      setStatus("complete");
      onComplete?.();
      return;
    }
    timerRef.current = window.setTimeout(() => {
      const nextRound = round + 1;
      setRound(nextRound);
      setFeedback(null);
      playLetterAudio(sessionLetters[nextRound].letter, audioRef);
    }, 650);
  }

  function replaySound() {
    if (status === "answering") playLetterAudio(target.letter, audioRef);
  }

  if (status === "ready") {
    return <GameIntro icon={<Volume2 size={25} />} eyebrow="Permainan 01 / Dengar" title="Dengar dan pilih" description="Dengar bunyi huruf, kemudian cari huruf yang betul dalam barisan A hingga Z." actionLabel="Mula permainan" onStart={startGame} />;
  }

  if (status === "complete") {
    return (
      <div className="huruf-game-result" role="status">
        <span className="huruf-game-result-icon"><Trophy size={28} /></span>
        <span className="section-kicker">Syabas!</span>
        <h3>Semua huruf selesai</h3>
        <p><strong>{score}/{SOUND_ROUNDS}</strong> jawapan betul.</p>
        <button className="primary-mini-action" type="button" onClick={startGame}><RotateCcw size={17} /> Main lagi</button>
      </div>
    );
  }

  return (
    <div className="huruf-sound-stage">
      <div className="huruf-game-score"><span>Huruf <strong>{round + 1}</strong> / {SOUND_ROUNDS}</span><span>Betul <strong>{score}</strong></span></div>
      <div className="huruf-sound-prompt">
        <span className="huruf-sound-wave"><Volume2 size={28} /></span>
        <div><strong>Dengar bunyi</strong><span>Tekan pembesar suara jika mahu ulang.</span></div>
        <button className="icon-game-button" type="button" onClick={replaySound} aria-label="Dengar bunyi semula" title="Dengar bunyi semula"><Volume2 size={20} /></button>
      </div>
      <div className="huruf-alphabet-row" aria-label="26 pilihan huruf">
        {HURUF.map((item) => (
          <button className={`huruf-alphabet-choice ${feedback?.type === "correct" && item.letter === target.letter ? "is-correct" : ""}`} key={item.letter} type="button" onClick={() => answer(item.letter)} aria-label={`Pilih huruf ${item.letter}`}>
            {item.letter}
          </button>
        ))}
      </div>
      <p className={`huruf-game-feedback ${feedback?.type || "idle"}`} role="status" aria-live="polite">
        {feedback?.type === "correct" ? <><Check size={17} /> {feedback.text}</> : feedback?.type === "wrong" ? <><X size={17} /> {feedback.text}</> : <><Sparkles size={17} /> Pilih huruf yang sepadan dengan bunyi.</>}
      </p>
    </div>
  );
}

function makePairChoices(target) {
  const distractors = shuffle(HURUF.filter((item) => item.letter !== target.letter)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

function PairingGame({ onComplete }) {
  const timerRef = useRef(null);
  const lobbyBgmRef = useRef(null);
  const [status, setStatus] = useState("ready");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const pair = pairs[round] || ANIMAL_PAIRS[0];
  const target = findLetter(pair.letter);
  const choices = useMemo(() => (status === "answering" ? makePairChoices(target) : []), [status, round, target]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (status !== "ready") {
      if (lobbyBgmRef.current) {
        lobbyBgmRef.current.pause();
        lobbyBgmRef.current.currentTime = 0;
        lobbyBgmRef.current = null;
      }
      return undefined;
    }

    const audio = new window.Audio(PAIR_AUDIO.lobby);
    audio.loop = true;
    audio.volume = 0.16;
    lobbyBgmRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
      if (lobbyBgmRef.current === audio) lobbyBgmRef.current = null;
    };
  }, [status]);

  function startGame() {
    const nextPairs = shuffle(ANIMAL_PAIRS).slice(0, PAIR_ROUNDS);
    setPairs(nextPairs);
    setRound(0);
    setScore(0);
    setFeedback(null);
    setSelectedLetter(null);
    setStatus("answering");
  }

  function deliver(letter) {
    if (status !== "answering" || feedback?.type === "correct") return;
    setSelectedLetter(letter);
    playPairEffect(PAIR_AUDIO.pop);
    if (letter !== pair.letter) {
      playPairEffect(PAIR_AUDIO.mistake);
      setFeedback({ type: "wrong", text: "Belum tepat. Pilih huruf kecil yang sepadan." });
      return;
    }
    const nextScore = score + 1;
    setScore(nextScore);
    playPairEffect(PAIR_AUDIO.yay);
    setFeedback({ type: "correct", text: `Betul! Beri ${letter.toLowerCase()} kepada anak ${pair.cub}.` });
    if (round === PAIR_ROUNDS - 1) {
      setStatus("complete");
      onComplete?.();
      return;
    }
    timerRef.current = window.setTimeout(() => {
      setRound((value) => value + 1);
      setFeedback(null);
      setSelectedLetter(null);
    }, 750);
  }

  function handleDrop(event) {
    event.preventDefault();
    const letter = event.dataTransfer.getData("text/plain");
    if (letter) deliver(letter);
  }

  if (status === "ready") {
    return <GameIntro icon={<Heart size={25} />} eyebrow="Permainan 02 / Padan" title="Beri huruf kepada anak" description="Seret huruf kecil yang betul kepada anak haiwan. Kamu juga boleh tekan satu huruf untuk memilihnya." actionLabel="Mula permainan" onStart={startGame} />;
  }

  if (status === "complete") {
    return (
      <div className="huruf-game-result" role="status">
        <span className="huruf-game-result-icon"><Heart size={28} fill="currentColor" /></span>
        <span className="section-kicker">Keluarga huruf gembira!</span>
        <h3>Semua pasangan selesai</h3>
        <p><strong>{score}/{PAIR_ROUNDS}</strong> huruf sampai kepada anak.</p>
        <button className="primary-mini-action" type="button" onClick={startGame}><RotateCcw size={17} /> Main lagi</button>
      </div>
    );
  }

  return (
    <div className="huruf-pair-stage">
      <div className="huruf-game-score"><span>Pasangan <strong>{round + 1}</strong> / {PAIR_ROUNDS}</span><span>Betul <strong>{score}</strong></span></div>
      <div className="huruf-pair-scene">
        <div className="huruf-animal-card huruf-mother-card"><img className="huruf-animal-image" src={pair.motherImage} alt={pair.mother} /><strong>{pair.mother}</strong><span className="huruf-held-letter">{pair.letter}</span><small>Huruf besar</small></div>
        <div className="huruf-pair-arrow" aria-hidden="true"><ArrowLeft size={23} /><span>hantar</span></div>
        <div className={`huruf-animal-card huruf-cub-card ${feedback?.type === "correct" ? "is-happy" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} role="group" aria-label={`Tempat letak huruf untuk ${pair.cub}`}>
          <img className="huruf-animal-image" src={pair.cubImage} alt={pair.cub} /><strong>{pair.cub}</strong><span className="huruf-drop-slot">{selectedLetter ? selectedLetter.toLowerCase() : "?"}</span><small>Letak huruf kecil di sini</small>
        </div>
      </div>
      <div className="huruf-pair-choices" aria-label="Empat pilihan huruf kecil">
        {choices.map((choice) => (
          <button className={`huruf-pair-choice ${selectedLetter === choice.letter ? "is-selected" : ""} ${feedback?.type === "correct" && choice.letter === pair.letter ? "is-correct" : ""}`} key={choice.letter} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", choice.letter)} onClick={() => deliver(choice.letter)} aria-label={`Seret atau pilih huruf kecil ${choice.letter.toLowerCase()}`}>
            <GripVertical size={16} aria-hidden="true" /><strong>{choice.letter.toLowerCase()}</strong>
          </button>
        ))}
      </div>
      <p className={`huruf-game-feedback ${feedback?.type || "idle"}`} role="status" aria-live="polite">
        {feedback?.type === "correct" ? <><Check size={17} /> {feedback.text}</> : feedback?.type === "wrong" ? <><X size={17} /> {feedback.text}</> : <><Sparkles size={17} /> Seret satu huruf kepada anak haiwan.</>}
      </p>
    </div>
  );
}

export default function HurufGames({ onBack, onComplete }) {
  const [game, setGame] = useState("sound");

  return (
    <section className="huruf-games" aria-labelledby="huruf-games-title">
      <div className="huruf-games-heading">
        <div><span className="section-kicker">Permainan / Main</span><h2 id="huruf-games-title">Pilih permainan huruf</h2><p>Dengar, kenal dan padankan huruf satu langkah demi satu langkah.</p></div>
        <button className="back-button huruf-games-back" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Huruf</span></button>
      </div>
      <div className="huruf-game-tabs" role="tablist" aria-label="Pilih permainan huruf">
        <button className={game === "sound" ? "is-selected" : ""} type="button" role="tab" aria-selected={game === "sound"} onClick={() => setGame("sound")}><Volume2 size={19} /><span><strong>Dengar dan pilih</strong><small>26 huruf dalam satu barisan</small></span></button>
        <button className={game === "pair" ? "is-selected" : ""} type="button" role="tab" aria-selected={game === "pair"} onClick={() => setGame("pair")}><Heart size={19} /><span><strong>Beri kepada anak</strong><small>Padan huruf besar dan kecil</small></span></button>
      </div>
      <div className="huruf-game-board" role="tabpanel">
        {game === "sound" ? <SoundChoiceGame onComplete={onComplete} /> : <PairingGame onComplete={onComplete} />}
      </div>
    </section>
  );
}
