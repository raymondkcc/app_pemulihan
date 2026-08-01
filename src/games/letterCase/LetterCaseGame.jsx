import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Lightbulb,
  Play,
  RefreshCcw,
  Sparkles,
  Trophy,
  Volume2,
  X
} from "lucide-react";
import Phaser from "phaser";
import LetterCaseScene from "./LetterCaseScene.js";
import {
  advanceLetterCaseRound,
  createLetterCaseState,
  getLetterMastery,
  resolveLetterCaseAnswer,
  startLetterCaseSession
} from "./letterCaseSimulation.js";

function findLetter(letters, letter) {
  return letters.find((item) => item.letter === letter) || null;
}

function PhaserLetterBoard({ onReady }) {
  const mountRef = useRef(null);
  const onReadyRef = useRef(onReady);

  onReadyRef.current = onReady;

  useEffect(() => {
    if (!mountRef.current) return undefined;

    const config = {
      type: Phaser.AUTO,
      parent: mountRef.current,
      width: 900,
      height: 520,
      transparent: true,
      banner: false,
      audio: { noAudio: true },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: true,
        roundPixels: true
      },
      scene: [LetterCaseScene]
    };

    const game = new Phaser.Game(config);
    game.registry.set("onReady", (scene) => onReadyRef.current?.(scene));

    return () => {
      game.registry.set("onReady", null);
      game.destroy(true);
    };
  }, []);

  return <div className="letter-case-phaser" ref={mountRef} aria-hidden="true" />;
}

export default function LetterCaseGame({ letters, onPlayLetter }) {
  const [gameState, setGameState] = useState(() => createLetterCaseState(letters));
  const [hintVisible, setHintVisible] = useState(false);
  const [scene, setScene] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (scene && gameState.lastResult) {
      scene.events.emit("game:feedback", gameState.lastResult);
    }
  }, [gameState.lastResult, scene]);

  function playTargetAudio() {
    const target = findLetter(letters, gameState.round?.targetLetter);
    if (target) onPlayLetter?.(target);
  }

  function startGame() {
    window.clearTimeout(timerRef.current);
    setHintVisible(false);
    const nextState = startLetterCaseSession(letters);
    setGameState(nextState);
    const target = findLetter(letters, nextState.round.targetLetter);
    if (target) onPlayLetter?.(target);
  }

  function answer(letter) {
    if (!gameState.round || gameState.status !== "answering") return;

    const { state: nextState } = resolveLetterCaseAnswer(gameState, letter);
    setGameState(nextState);
    setHintVisible(false);

    if (nextState.status === "success") {
      const target = findLetter(letters, nextState.round.targetLetter);
      if (target) onPlayLetter?.(target);
      timerRef.current = window.setTimeout(() => {
        setGameState((currentState) => advanceLetterCaseRound(currentState, letters));
      }, 950);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setGameState((currentState) => currentState.status === "retry"
        ? { ...currentState, status: "answering", lastResult: null }
        : currentState);
    }, 700);
  }

  function showHint() {
    if (gameState.status !== "answering") return;
    setHintVisible(true);
    playTargetAudio();
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (event.key.toLowerCase() === "r" && gameState.status === "answering") {
        event.preventDefault();
        playTargetAudio();
        return;
      }

      if (event.key === "Enter" && gameState.status === "ready") {
        event.preventDefault();
        startGame();
        return;
      }

      if (gameState.status !== "answering") return;
      const choiceIndex = Number(event.key) - 1;
      if (choiceIndex >= 0 && choiceIndex < gameState.round.choices.length) {
        event.preventDefault();
        answer(gameState.round.choices[choiceIndex]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function handleSceneReady(nextScene) {
    setScene(nextScene);
  }

  if (gameState.status === "complete") {
    const needsPractice = letters
      .filter((item) => (gameState.letterStats[item.letter]?.wrong || 0) > 0)
      .slice(0, 4);

    return (
      <section className="letter-case-game" aria-labelledby="letter-case-game-title">
        <div className="letter-case-game-heading">
          <div>
            <span className="section-kicker">Permainan / Main</span>
            <h2 id="letter-case-game-title">Pos Pasangan Huruf</h2>
            <p>Hantar setiap huruf kepada pasangan besarnya atau kecilnya.</p>
          </div>
          <span className="letter-case-game-badge"><Trophy size={16} /> Sesi tamat</span>
        </div>
        <div className="letter-case-game-shell letter-case-game-complete">
          <PhaserLetterBoard onReady={handleSceneReady} />
          <div className="letter-case-game-result" role="status" aria-live="polite">
            <span className="letter-case-result-icon"><Trophy size={28} /></span>
            <span className="section-kicker">Syabas!</span>
            <h3>Sesi selesai</h3>
            <p><strong>{gameState.correct}/{gameState.totalRounds}</strong> padanan betul dengan {gameState.wrong} cubaan semula.</p>
            <div className="letter-case-result-stars" aria-label={`${gameState.correct} padanan betul`}>
              {Array.from({ length: gameState.totalRounds }, (_, index) => <Sparkles key={index} size={18} fill={index < gameState.correct ? "currentColor" : "none"} />)}
            </div>
            {needsPractice.length > 0 && (
              <p className="letter-case-practice-note">Boleh ulang lagi: {needsPractice.map((item) => item.letter).join(", ")}.</p>
            )}
            <button className="primary-mini-action" type="button" onClick={startGame}><RefreshCcw size={17} /> Main lagi</button>
          </div>
        </div>
      </section>
    );
  }

  const isReady = gameState.status === "ready";
  const isAnswering = gameState.status === "answering";
  const target = gameState.round ? findLetter(letters, gameState.round.targetLetter) : null;
  const targetGlyph = gameState.round?.targetGlyph || "A";

  return (
    <section className="letter-case-game" aria-labelledby="letter-case-game-title">
      <div className="letter-case-game-heading">
        <div>
          <span className="section-kicker">Permainan / Main</span>
          <h2 id="letter-case-game-title">Pos Pasangan Huruf</h2>
          <p>Padankan huruf besar dengan huruf kecil dalam lima misi pendek.</p>
        </div>
        <span className="letter-case-game-badge"><Sparkles size={16} /> 5 misi</span>
      </div>

      <div className="letter-case-game-shell">
        <PhaserLetterBoard onReady={handleSceneReady} />
        <div className="letter-case-game-overlay">
          {isReady ? (
            <div className="letter-case-start-card">
              <span className="letter-case-postmark"><Sparkles size={20} /></span>
              <span className="section-kicker">Misi bermula di sini</span>
              <h3>Hantar huruf kepada pasangan!</h3>
              <p>Lihat huruf sasaran, kemudian pilih pasangan yang betul.</p>
              <button className="primary-mini-action" type="button" onClick={startGame}><Play size={18} fill="currentColor" /> Mula misi</button>
              <span className="letter-case-key-hint">Tekan Enter untuk mula</span>
            </div>
          ) : (
            <>
              <div className="letter-case-target-card">
                <span className="section-kicker">{gameState.round.prompt}</span>
                <div className="letter-case-target-glyph" aria-label={`Huruf sasaran ${targetGlyph}`}>{targetGlyph}</div>
                <div className="letter-case-target-word">
                  <span>{target?.emoji}</span>
                  <strong>{target?.word}</strong>
                </div>
                <button className="letter-case-audio-button" type="button" onClick={playTargetAudio} disabled={!target || !isAnswering}>
                  <Volume2 size={17} /> Dengar
                  <span className="sr-only"> bunyi {targetGlyph}</span>
                </button>
              </div>

              <div className="letter-case-choices" aria-label="Pilihan pasangan huruf">
                {gameState.round.choices.map((choice, index) => {
                  const isCorrect = gameState.lastResult?.targetLetter === choice && gameState.lastResult?.type === "correct";
                  const isWrong = gameState.lastResult?.selectedLetter === choice && gameState.lastResult?.type === "retry";
                  const isHint = hintVisible && choice === gameState.round.targetLetter;
                  const glyph = gameState.round.answerCase === "small" ? choice.toLowerCase() : choice;
                  return (
                    <button
                      className={`letter-case-choice ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""} ${isHint ? "is-hint" : ""}`}
                      type="button"
                      key={`${gameState.round.id}-${choice}`}
                      onClick={() => answer(choice)}
                      disabled={!isAnswering}
                      aria-label={`Pilihan ${glyph}`}
                    >
                      <strong>{glyph}</strong>
                      <span className="letter-case-choice-key">{index + 1}</span>
                    </button>
                  );
                })}
              </div>

              <div className="letter-case-game-controls">
                <button className="letter-case-small-control" type="button" onClick={playTargetAudio} disabled={!isAnswering} title="Dengar semula">
                  <Volume2 size={16} /> Ulang bunyi
                </button>
                <button className="letter-case-small-control" type="button" onClick={showHint} disabled={!isAnswering} title="Tunjuk petunjuk">
                  <Lightbulb size={16} /> Petunjuk
                </button>
                <span className="letter-case-progress"><strong>{gameState.roundNumber}</strong>/{gameState.totalRounds} misi</span>
              </div>

              <div className={`letter-case-feedback ${gameState.status}`} role="status" aria-live="polite">
                {gameState.status === "success" && <><Check size={17} /> Betul! {gameState.round.targetLetter} jadi {gameState.round.targetLetter.toLowerCase()}.</>}
                {gameState.status === "retry" && <><X size={17} /> Cuba lagi. Cari pasangan untuk {gameState.round.targetGlyph}.</>}
                {isAnswering && <><ArrowRight size={17} /> Pilih satu kad huruf.</>}
              </div>

              <span className="letter-case-key-hint">1-{gameState.round.choices.length} pilih kad · R ulang bunyi</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
