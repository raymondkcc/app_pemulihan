import { useCallback, useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { ArrowLeft, Heart, HeartCrack, RotateCcw, Sparkles } from "lucide-react";
import "./KvSoundPondGame.css";

const SESSIONS = [5, 10, 15];

const KV_SETS = [
  { id: "a", title: "Bunyi a", syllables: ["ba", "ka", "ca", "ma"] },
  { id: "e-pepet", title: "Bunyi e pepet", syllables: ["be", "de", "ge", "me"], eSound: "e-pepet" },
  { id: "e-taling", title: "Bunyi e taling", syllables: ["be", "de", "ge", "me"], eSound: "e-taling" },
  { id: "i", title: "Bunyi i", syllables: ["bi", "di", "gi", "mi"] },
  { id: "o", title: "Bunyi o", syllables: ["bo", "ko", "go", "mo"] },
  { id: "u", title: "Bunyi u", syllables: ["bu", "ku", "mu", "su"] }
];

const PAD_COLORS = [0x7ad1b0, 0xffc95e, 0x9cc7f0, 0xf49dac];
const AUDIO_BOOST = 1.65;
const CORRECT_SOUND_PATH = "/audio/kv-sound-pond/correct-answer.mp3";
const SPLASH_SOUND_PATH = "/audio/kv-sound-pond/water-splash.mp3";
const BGM_PATH = "/audio/kv-sound-pond/background-music.mp3";
const GAME_OVER_SOUND_PATH = "/audio/kv-sound-pond/game-over.mp3";
const BGM_VOLUME = 0.18;
const BGM_DUCKED_VOLUME = 0.04;
const INITIAL_LIVES = 5;
const FROG_POSES = Object.freeze({
  IDLE: "idle",
  JUMP: "jump",
  WRONG: "wrong",
  HAPPY: "happy"
});

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function makeRound(syllables, previousTarget = "", eSound = "") {
  const candidates = syllables.filter((syllable) => syllable !== previousTarget);
  const target = candidates[Math.floor(Math.random() * candidates.length)] || syllables[0];
  return { target, choices: shuffle(syllables), eSound };
}

function audioPath(syllable, eSound = "") {
  return `/audio/syllables/KV/KV_${syllable}${eSound ? `_${eSound}` : ""}.mp3`;
}

class PondScene extends Phaser.Scene {
  constructor(bridge) {
    super("PondScene");
    this.bridge = bridge;
    this.roundLayer = null;
  }

  create() {
    this.drawPond();
    this.bridge.ready = true;
    if (this.bridge.state) this.renderRound(this.bridge.state);
  }

  drawPond() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x79d9df, 1);
    graphics.fillRect(0, 0, 960, 540);

    graphics.fillStyle(0x55bdd4, 0.38);
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const x = 70 + column * 150 + (row % 2 ? 58 : 0);
        const y = 54 + row * 133;
        graphics.fillEllipse(x, y, 116, 24);
      }
    }

    graphics.fillStyle(0x2e8b75, 1);
    graphics.fillCircle(50, 42, 52);
    graphics.fillCircle(900, 505, 68);
    graphics.fillStyle(0x3fa980, 1);
    graphics.fillCircle(87, 36, 39);
    graphics.fillCircle(860, 509, 53);

    for (let index = 0; index < 12; index += 1) {
      const x = 88 + ((index * 137) % 792);
      const y = 52 + ((index * 83) % 436);
      const leaf = this.add.graphics();
      leaf.fillStyle(0x2e9662, 0.52);
      leaf.fillCircle(x, y, 13);
      leaf.fillStyle(0x79d9df, 1);
      leaf.fillTriangle(x, y, x + 17, y - 3, x + 17, y + 3);
    }

    const title = this.add.text(480, 26, "LOMPAT SI KATAK LOMPAT", {
      fontFamily: "Comic Sans MS, Comic Sans, Comic Neue, cursive",
      fontSize: "19px",
      fontStyle: "bold",
      color: "#145e46"
    }).setOrigin(0.5);
    title.setShadow(0, 2, "#dffef4", 2, true, false);
  }

  renderRound(state) {
    this.roundLayer?.destroy(true);
    this.roundLayer = this.add.container(0, 0);
    this.viewState = state;

    const start = { x: 480, y: 286 };
    const padPositions = [
      { x: 202, y: 180 },
      { x: 758, y: 180 },
      { x: 202, y: 414 },
      { x: 758, y: 414 }
    ];

    const guide = this.add.graphics();
    guide.lineStyle(6, 0xdffaf2, 0.86);
    guide.beginPath();
    guide.moveTo(306, 298);
    guide.lineTo(654, 298);
    guide.strokePath();
    this.roundLayer.add(guide);

    const prompt = this.add.text(480, 78, "DENGAR", {
      fontFamily: "Comic Sans MS, Comic Sans, Comic Neue, cursive",
      fontSize: "18px",
      fontStyle: "900",
      color: "#145e46"
    }).setOrigin(0.5);
    this.roundLayer.add(prompt);

    const soundOrb = this.add.circle(480, 122, 36, 0xfbf2c1, 1)
      .setStrokeStyle(4, 0x145e46, 0.72)
      .setInteractive({ useHandCursor: false });
    const speakerIcon = this.add.graphics().setPosition(480, 122);
    speakerIcon.fillStyle(0x145e46, 1);
    speakerIcon.fillRect(-19, -8, 10, 16);
    speakerIcon.fillTriangle(-9, -8, 4, -18, 4, 18);
    speakerIcon.lineStyle(4, 0x145e46, 1);
    speakerIcon.beginPath();
    speakerIcon.arc(3, 0, 13, -0.72, 0.72, false);
    speakerIcon.strokePath();
    speakerIcon.beginPath();
    speakerIcon.arc(3, 0, 22, -0.67, 0.67, false);
    speakerIcon.strokePath();
    soundOrb.on("pointerdown", () => {
      if (this.viewState.phase !== "playing") return;
      this.bridge.onReplay();
      this.tweens.add({ targets: [soundOrb, speakerIcon], scale: 0.86, duration: 90, yoyo: true, ease: "Sine.easeOut" });
    });
    this.roundLayer.add([soundOrb, speakerIcon]);

    this.tweens.add({
      targets: [soundOrb, speakerIcon],
      scale: { from: 0.94, to: 1.08 },
      duration: 680,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    let selectedPosition = null;
    state.round.choices.forEach((choice, index) => {
      const position = padPositions[index];
      if (choice === state.feedback?.choice) selectedPosition = position;
      this.drawAnswerPad(choice, index, position, state);
    });

    const frog = this.drawFrog(start.x, start.y);
    this.roundLayer.add(frog);

    if (state.feedback && selectedPosition) this.animateFrogFeedback(frog, start, selectedPosition, state.feedback.correct);

    if (state.feedback) {
      const message = state.feedback.correct ? "BETUL!" : `BUNYI: ${state.round.target.toUpperCase()}`;
      const bubble = this.add.container(480, 492);
      const panel = this.add.rectangle(0, 0, state.feedback.correct ? 148 : 220, 47, state.feedback.correct ? 0xffec83 : 0xf9f4d7, 0.96).setStrokeStyle(3, 0x145e46, 0.48);
      const text = this.add.text(0, 1, message, {
        fontFamily: "Comic Sans MS, Comic Sans, Comic Neue, cursive",
        fontSize: state.feedback.correct ? "23px" : "18px",
        fontStyle: "bold",
        color: "#145e46"
      }).setOrigin(0.5);
      bubble.add([panel, text]);
      this.roundLayer.add(bubble);
    }
  }

  animateFrogFeedback(frog, start, destination, isCorrect) {
    const landingY = destination.y - 54;
    this.setFrogPose(frog, FROG_POSES.JUMP);
    frog.setScale(0.92);

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 650,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        const progress = tween.getValue();
        const arc = Math.sin(Math.PI * progress) * 126;
        frog.setPosition(
          Phaser.Math.Linear(start.x, destination.x, progress),
          Phaser.Math.Linear(start.y, landingY, progress) - arc
        );
        frog.setAngle(Phaser.Math.Linear(-12, 8, progress));
        frog.setScale(Phaser.Math.Linear(0.92, 1, progress));
      },
      onComplete: () => {
        frog.setAngle(0);
        if (isCorrect) {
          this.setFrogPose(frog, FROG_POSES.HAPPY);
          this.bridge.onCorrectLanding();
          const sparkle = this.add.star(destination.x + 77, destination.y - 65, 5, 11, 24, 0xffe568, 1).setStrokeStyle(3, 0x145e46, 0.35);
          this.roundLayer.add(sparkle);
          this.tweens.add({ targets: sparkle, angle: 360, scale: 1.35, duration: 650, ease: "Sine.easeOut" });
          this.tweens.add({ targets: frog, scaleY: 0.9, scaleX: 1.08, duration: 140, yoyo: true, repeat: 1, ease: "Sine.easeInOut" });
          return;
        }
        this.dropFrogIntoPond(frog, destination);
      }
    });
  }

  dropFrogIntoPond(frog, destination) {
    this.bridge.onWrongLanding();
    const splash = this.add.container(destination.x, destination.y + 22);
    [22, 42, 63].forEach((width, index) => {
      const ripple = this.add.ellipse(0, 0, width, Math.max(9, width * 0.28), 0x79d9df, 0)
        .setStrokeStyle(4, 0xfffdf2, 0.88)
        .setScale(0.28)
        .setAlpha(0.9);
      splash.add(ripple);
      this.tweens.add({
        targets: ripple,
        scaleX: 2.35,
        scaleY: 1.55,
        alpha: 0,
        duration: 540,
        delay: index * 95,
        ease: "Sine.easeOut"
      });
    });
    this.roundLayer.add(splash);
    this.setFrogPose(frog, FROG_POSES.WRONG);
    this.tweens.add({
      targets: frog,
      y: destination.y + 118,
      alpha: 0,
      scaleX: 0.68,
      scaleY: 0.42,
      duration: 440,
      ease: "Sine.easeIn"
    });
  }

  drawFrog(x, y) {
    const frog = this.add.container(x, y).setDepth(8);
    const body = this.add.graphics();
    body.fillStyle(0x145e46, 0.24);
    body.fillEllipse(0, 61, 126, 24);
    body.fillStyle(0x77be3f, 1);
    body.fillEllipse(-45, 37, 48, 27);
    body.fillEllipse(45, 37, 48, 27);
    body.fillStyle(0x8fd147, 1);
    body.fillEllipse(0, 16, 98, 72);
    body.lineStyle(4, 0x145e46, 1);
    body.strokeEllipse(0, 16, 98, 72);
    body.fillStyle(0xf7edb8, 1);
    body.fillEllipse(0, 30, 62, 28);
    frog.add(body);

    const pupils = [];
    [-28, 28].forEach((offset) => {
      const eye = this.add.circle(offset, -21, 21, 0x8fd147, 1).setStrokeStyle(4, 0x145e46, 1);
      const white = this.add.circle(offset, -21, 10, 0xfffdf2, 1);
      const pupil = this.add.circle(offset + 2, -19, 5, 0x172230, 1);
      frog.add([eye, white, pupil]);
      pupils.push(pupil);
    });

    const limbs = this.add.graphics();
    const face = this.add.graphics();
    frog.add([limbs, face]);
    frog.setData("frogFace", face);
    frog.setData("frogLimbs", limbs);
    frog.setData("frogPupils", pupils);
    this.setFrogPose(frog, FROG_POSES.IDLE);
    return frog;
  }

  setFrogPose(frog, pose) {
    const face = frog.getData("frogFace");
    const limbs = frog.getData("frogLimbs");
    const pupils = frog.getData("frogPupils") || [];
    frog.setData("pose", pose);
    face.clear();
    limbs.clear();
    limbs.lineStyle(6, 0x145e46, 1);

    if (pose === FROG_POSES.HAPPY) {
      limbs.lineBetween(-36, 22, -60, -18);
      limbs.lineBetween(-60, -18, -74, -8);
      limbs.lineBetween(36, 22, 60, -18);
      limbs.lineBetween(60, -18, 74, -8);
      face.lineStyle(5, 0x145e46, 1);
      face.beginPath();
      face.arc(0, -1, 26, 0.08, Math.PI - 0.08, false);
      face.strokePath();
      face.fillStyle(0xf4a3a5, 0.9);
      face.fillCircle(-31, 12, 6);
      face.fillCircle(31, 12, 6);
      pupils.forEach((pupil, index) => pupil.setPosition(index === 0 ? -26 : 30, -23));
      return;
    }

    if (pose === FROG_POSES.WRONG) {
      limbs.lineBetween(-35, 24, -58, 41);
      limbs.lineBetween(35, 24, 58, 41);
      face.fillStyle(0x145e46, 1);
      face.fillEllipse(0, 10, 18, 22);
      pupils.forEach((pupil, index) => pupil.setPosition(index === 0 ? -32 : 24, -16));
      return;
    }

    if (pose === FROG_POSES.JUMP) {
      limbs.lineBetween(-34, 20, -63, -3);
      limbs.lineBetween(-63, -3, -72, 8);
      limbs.lineBetween(34, 20, 63, -3);
      limbs.lineBetween(63, -3, 72, 8);
      pupils.forEach((pupil, index) => pupil.setPosition(index === 0 ? -24 : 32, -25));
    } else {
      limbs.lineBetween(-35, 25, -56, 40);
      limbs.lineBetween(35, 25, 56, 40);
      pupils.forEach((pupil, index) => pupil.setPosition(index === 0 ? -26 : 30, -19));
    }

    face.lineStyle(4, 0x145e46, 1);
    face.beginPath();
    face.arc(0, 3, 20, 0.15, Math.PI - 0.15, false);
    face.strokePath();
  }

  drawAnswerPad(choice, index, position, state) {
    const isCorrect = choice === state.round.target;
    const feedbackChoice = state.feedback?.choice === choice;
    const revealCorrect = Boolean(state.feedback && isCorrect);
    const baseColor = PAD_COLORS[index];
    const activeColor = revealCorrect ? 0x8fd147 : feedbackChoice && !isCorrect ? 0xd5dfe2 : baseColor;
    const pad = this.add.graphics();
    pad.fillStyle(0x145e46, 0.24);
    pad.fillEllipse(position.x + 4, position.y + 30, 238, 90);
    pad.fillStyle(activeColor, 1);
    pad.fillEllipse(position.x, position.y, 230, 92);
    pad.lineStyle(4, 0x145e46, 0.6);
    pad.strokeEllipse(position.x, position.y, 230, 92);
    this.roundLayer.add(pad);

    [-66, 0, 66].forEach((offset) => {
      const bubble = this.add.circle(position.x + offset, position.y - 12, 33, 0xfffdf2, 0.96).setStrokeStyle(3, 0x145e46, 0.47);
      const label = this.add.text(position.x + offset, position.y - 11, choice, {
        fontFamily: "Comic Sans MS, Comic Sans, Comic Neue, cursive",
        fontSize: "25px",
        fontStyle: "bold",
        color: "#145e46"
      }).setOrigin(0.5);
      this.roundLayer.add([bubble, label]);
    });

    const hitZone = this.add.zone(position.x, position.y, 238, 110).setInteractive({ useHandCursor: false });
    hitZone.on("pointerdown", () => {
      if (this.viewState.phase === "playing") this.bridge.onChoice(choice);
    });
    this.roundLayer.add(hitZone);

    if (feedbackChoice && !isCorrect) {
      this.tweens.add({ targets: hitZone, alpha: 0.76, duration: 180, yoyo: true, repeat: 1 });
    }
  }
}

function PondCanvas({ round, feedback, phase, onChoice, onReplay, onCorrectLanding, onWrongLanding }) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const sceneRef = useRef(null);
  const choiceRef = useRef(onChoice);
  const replayRef = useRef(onReplay);
  const correctLandingRef = useRef(onCorrectLanding);
  const wrongLandingRef = useRef(onWrongLanding);

  choiceRef.current = onChoice;
  replayRef.current = onReplay;
  correctLandingRef.current = onCorrectLanding;
  wrongLandingRef.current = onWrongLanding;

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const bridge = {
      state: { round, feedback, phase },
      onChoice: (choice) => choiceRef.current(choice),
      onReplay: () => replayRef.current(),
      onCorrectLanding: () => correctLandingRef.current(),
      onWrongLanding: () => wrongLandingRef.current()
    };
    const scene = new PondScene(bridge);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 960,
      height: 540,
      backgroundColor: "#79d9df",
      scene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY }
    });
    gameRef.current = game;
    sceneRef.current = scene;

    return () => game.destroy(true);
  }, []);

  useEffect(() => {
    const state = { round, feedback, phase };
    const scene = sceneRef.current;
    if (!scene) return;
    scene.bridge.state = state;
    if (scene.bridge.ready) scene.renderRound(state);
  }, [feedback, phase, round]);

  return <div className="pond-canvas" ref={hostRef} aria-label="Lompat Si Katak Lompat" />;
}

export default function KvSoundPondGame() {
  const [setId, setSetId] = useState("a");
  const [questionCount, setQuestionCount] = useState(10);
  const [phase, setPhase] = useState("setup");
  const [roundNumber, setRoundNumber] = useState(0);
  const [round, setRound] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [feedback, setFeedback] = useState(null);
  const audioTimers = useRef([]);
  const activeAudio = useRef([]);
  const audioContextRef = useRef(null);
  const audioGainRef = useRef(null);
  const effectGainRef = useRef(null);
  const correctAudioRef = useRef(null);
  const splashAudioRef = useRef(null);
  const gameOverAudioRef = useRef(null);
  const bgmAudioRef = useRef(null);
  const bgmRestoreTimer = useRef(null);
  const nextTimer = useRef(null);
  const lastTarget = useRef("");

  const activeSet = KV_SETS.find((set) => set.id === setId) || KV_SETS[0];

  const startSoundSystem = useCallback(() => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    try {
      if (!audioContextRef.current) {
        const context = new AudioContextConstructor();
        const gain = context.createGain();
        const effectGain = context.createGain();
        gain.gain.value = AUDIO_BOOST;
        effectGain.gain.value = 1;
        gain.connect(context.destination);
        effectGain.connect(context.destination);
        audioContextRef.current = context;
        audioGainRef.current = gain;
        effectGainRef.current = effectGain;
      }
      if (audioContextRef.current.state === "suspended") audioContextRef.current.resume().catch(() => {});
      return audioContextRef.current;
    } catch {
      return null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    audioTimers.current.forEach((timer) => window.clearTimeout(timer));
    audioTimers.current = [];
    window.clearTimeout(bgmRestoreTimer.current);
    if (bgmAudioRef.current) bgmAudioRef.current.volume = BGM_VOLUME;
    activeAudio.current.forEach(({ audio, source }) => {
      audio.pause();
      audio.currentTime = 0;
      source?.disconnect();
    });
    activeAudio.current = [];
  }, []);

  const stopEffect = useCallback((effectRef) => {
    if (!effectRef.current) return;
    const { audio, source } = effectRef.current;
    audio.pause();
    audio.currentTime = 0;
    source?.disconnect();
    effectRef.current = null;
  }, []);

  const playEffect = useCallback((path, effectRef) => {
    stopEffect(effectRef);
    const context = startSoundSystem();
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.volume = 1;
    let source = null;
    try {
      if (context && effectGainRef.current) {
        source = context.createMediaElementSource(audio);
        source.connect(effectGainRef.current);
      }
    } catch {
      source = null;
    }
    effectRef.current = { audio, source };
    audio.addEventListener("ended", () => {
      source?.disconnect();
      if (effectRef.current?.audio === audio) effectRef.current = null;
    }, { once: true });
    audio.play().catch(() => {});
  }, [startSoundSystem, stopEffect]);

  const stopCorrectSound = useCallback(() => stopEffect(correctAudioRef), [stopEffect]);
  const stopSplashSound = useCallback(() => stopEffect(splashAudioRef), [stopEffect]);
  const stopGameOverSound = useCallback(() => stopEffect(gameOverAudioRef), [stopEffect]);
  const playCorrectSound = useCallback(() => playEffect(CORRECT_SOUND_PATH, correctAudioRef), [playEffect]);
  const playSplashSound = useCallback(() => playEffect(SPLASH_SOUND_PATH, splashAudioRef), [playEffect]);
  const playGameOverSound = useCallback(() => playEffect(GAME_OVER_SOUND_PATH, gameOverAudioRef), [playEffect]);

  const stopBgm = useCallback(() => {
    window.clearTimeout(bgmRestoreTimer.current);
    if (!bgmAudioRef.current) return;
    bgmAudioRef.current.pause();
    bgmAudioRef.current.currentTime = 0;
    bgmAudioRef.current = null;
  }, []);

  const startBgm = useCallback(() => {
    stopBgm();
    const audio = new Audio(BGM_PATH);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    bgmAudioRef.current = audio;
    audio.play().catch(() => {});
  }, [stopBgm]);

  const playTarget = useCallback((roundData) => {
    if (!roundData?.target) return;
    stopAudio();
    const context = startSoundSystem();
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = BGM_DUCKED_VOLUME;
      bgmRestoreTimer.current = window.setTimeout(() => {
        if (bgmAudioRef.current) bgmAudioRef.current.volume = BGM_VOLUME;
      }, 2050);
    }
    [0, 700, 1400].forEach((delay) => {
      const timer = window.setTimeout(() => {
        const audio = new Audio(audioPath(roundData.target, roundData.eSound));
        audio.preload = "auto";
        audio.volume = 1;
        let source = null;
        try {
          if (context && audioGainRef.current) {
            source = context.createMediaElementSource(audio);
            source.connect(audioGainRef.current);
          }
        } catch {
          source = null;
        }
        activeAudio.current.push({ audio, source });
        audio.addEventListener("ended", () => {
          source?.disconnect();
          activeAudio.current = activeAudio.current.filter((entry) => entry.audio !== audio);
        }, { once: true });
        audio.play().catch(() => {});
      }, delay);
      audioTimers.current.push(timer);
    });
  }, [startSoundSystem, stopAudio]);

  const openRound = useCallback((nextRoundNumber, nextSet = activeSet) => {
    const nextRound = makeRound(nextSet.syllables, lastTarget.current, nextSet.eSound);
    lastTarget.current = nextRound.target;
    setRound(nextRound);
    setRoundNumber(nextRoundNumber);
    setFeedback(null);
    setPhase("playing");
  }, [activeSet]);

  useEffect(() => {
    const audioPreloads = [CORRECT_SOUND_PATH, SPLASH_SOUND_PATH, GAME_OVER_SOUND_PATH, BGM_PATH].map((path) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.load();
      return audio;
    });
    return () => {
      audioPreloads.forEach((audio) => {
        audio.removeAttribute("src");
        audio.load();
      });
    };
  }, []);

  useEffect(() => () => {
    stopAudio();
    stopCorrectSound();
    stopSplashSound();
    stopGameOverSound();
    stopBgm();
    window.clearTimeout(nextTimer.current);
    audioGainRef.current?.disconnect();
    effectGainRef.current?.disconnect();
    audioContextRef.current?.close().catch(() => {});
  }, [stopAudio, stopBgm, stopCorrectSound, stopGameOverSound, stopSplashSound]);

  useEffect(() => {
    if (phase === "setup" || phase === "complete" || phase === "gameover") stopBgm();
  }, [phase, stopBgm]);

  useEffect(() => {
    if (phase !== "playing" || !round) return undefined;
    const timer = window.setTimeout(() => playTarget(round), 320);
    return () => window.clearTimeout(timer);
  }, [phase, playTarget, round]);

  function startSession() {
    startSoundSystem();
    stopCorrectSound();
    stopSplashSound();
    stopGameOverSound();
    startBgm();
    lastTarget.current = "";
    setCorrect(0);
    setLives(INITIAL_LIVES);
    openRound(1, activeSet);
  }

  function chooseAnswer(choice) {
    if (phase !== "playing" || !round) return;
    const isCorrect = choice === round.target;
    const nextLives = isCorrect ? lives : Math.max(0, lives - 1);
    stopAudio();
    setFeedback({ choice, correct: isCorrect });
    setPhase("feedback");
    if (isCorrect) setCorrect((current) => current + 1);
    else setLives(nextLives);

    nextTimer.current = window.setTimeout(() => {
      if (nextLives === 0) {
        stopBgm();
        playGameOverSound();
        setPhase("gameover");
        return;
      }
      if (roundNumber >= questionCount) {
        setPhase("complete");
        return;
      }
      openRound(roundNumber + 1, activeSet);
    }, isCorrect ? 1650 : 1900);
  }

  const stars = correct === questionCount ? 3 : correct >= Math.ceil(questionCount * 0.6) ? 2 : 1;
  const answeredCount = phase === "feedback" ? roundNumber : Math.max(0, roundNumber - 1);

  if (phase === "setup") {
    return (
      <main className="pond-page pond-setup-page">
        <a className="pond-back" href="/" title="Kembali ke ruang belajar"><ArrowLeft size={20} /> Kembali</a>
        <section className="pond-setup" aria-labelledby="pond-setup-title">
          <div className="pond-setup-sky" aria-hidden="true"><img src="/images/pond/echo-frog.svg" alt="" /></div>
          <div className="pond-setup-copy">
            <span>LATIHAN BUNYI KV</span>
            <h1 id="pond-setup-title">Lompat Si Katak Lompat</h1>
            <p>Pilih bunyi dan bilangan soalan.</p>
          </div>
          <div className="pond-choice-block">
            <h2>Bunyi hari ini</h2>
            <div className="pond-set-grid">
              {KV_SETS.map((set) => (
                <button className={`pond-set-option ${set.id === setId ? "is-selected" : ""}`} type="button" key={set.id} onClick={() => setSetId(set.id)} aria-pressed={set.id === setId}>
                  <strong>{set.title}</strong><span>{set.syllables.join("  ")}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pond-choice-block pond-rounds-block">
            <h2>Bilangan soalan</h2>
            <div className="pond-round-options">
              {SESSIONS.map((count) => <button type="button" key={count} className={count === questionCount ? "is-selected" : ""} onClick={() => setQuestionCount(count)} aria-pressed={count === questionCount}>{count}</button>)}
            </div>
          </div>
          <button className="pond-start" type="button" onClick={startSession}><Sparkles size={24} /> Mula bermain</button>
        </section>
      </main>
    );
  }

  if (phase === "complete") {
    return (
      <main className="pond-page pond-finish-page">
        <section className="pond-finish" aria-labelledby="pond-finish-title">
          <div className="finish-stars" aria-label={`${stars} bintang`}>{Array.from({ length: 3 }, (_, index) => <Sparkles key={index} className={index < stars ? "is-earned" : ""} />)}</div>
          <img className="finish-frog" src="/images/pond/echo-frog.svg" alt="Katak sedang gembira" />
          <p>{correct} / {questionCount} bunyi tepat</p>
          <h1 id="pond-finish-title">Hebat!</h1>
          <button className="pond-start" type="button" onClick={() => setPhase("setup")}><RotateCcw size={22} /> Main lagi</button>
        </section>
      </main>
    );
  }

  if (phase === "gameover") {
    return (
      <main className="pond-page pond-finish-page">
        <section className="pond-finish pond-gameover" aria-labelledby="pond-gameover-title">
          <HeartCrack className="gameover-icon" aria-hidden="true" />
          <span className="gameover-kicker">NYAWA HABIS</span>
          <h1 id="pond-gameover-title">Permainan tamat</h1>
          <p>{correct} bunyi tepat</p>
          <button className="pond-start" type="button" onClick={startSession}><RotateCcw size={22} /> Cuba lagi</button>
        </section>
      </main>
    );
  }

  return (
    <main className="pond-page pond-game-page">
      <header className="pond-hud">
        <a className="pond-back" href="/" title="Kembali ke ruang belajar"><ArrowLeft size={19} /><span>Kembali</span></a>
        <div className="pond-progress" aria-label={`Soalan ${roundNumber} daripada ${questionCount}`}>
          <div className="pond-progress-counter">
            <strong>{roundNumber}</strong>
            <span>/ {questionCount}</span>
          </div>
          <div className="pond-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={questionCount} aria-valuenow={answeredCount} aria-label={`Siap ${answeredCount} daripada ${questionCount}`}>
            <div className="pond-progress-fill" style={{ width: `${Math.min(100, (answeredCount / questionCount) * 100)}%` }} />
          </div>
        </div>
        <div className="pond-lives" aria-label={`${lives} nyawa tinggal`}>
          {Array.from({ length: INITIAL_LIVES }, (_, index) => (
            <Heart key={index} className={index < lives ? "" : "is-lost"} aria-hidden="true" />
          ))}
        </div>
      </header>
      {round && (
        <PondCanvas
          round={round}
          feedback={feedback}
          phase={phase}
          onChoice={chooseAnswer}
          onReplay={() => playTarget(round)}
          onCorrectLanding={playCorrectSound}
          onWrongLanding={playSplashSound}
        />
      )}
    </main>
  );
}
