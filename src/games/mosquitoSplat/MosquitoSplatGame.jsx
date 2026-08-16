import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bug, Clock3, Flame, Heart, HeartCrack, Play, RotateCcw, Sparkles, Target, Timer, Volume2, VolumeX, Zap } from "lucide-react";

const IMAGES = {
  fly: "/images/mosquito/mosquito-fly.png",
  splat: "/images/mosquito/mosquito-splat.png",
  burned: "/images/mosquito/mosquito-burned.png",
  swatter: "/images/mosquito/swatter.png",
  zapper: "/images/mosquito/zapper.png"
};

const SOUNDS = {
  bgm: "/audio/mosquito/bgm.mp3",
  zapBgm: "/audio/mosquito/zap-bgm.mp3",
  slap: "/audio/mosquito/slap.mp3",
  zap: "/audio/mosquito/zap.mp3",
  buzzFly: "/audio/mosquito/buzz-fly.mp3",
  buzzLoop: "/audio/mosquito/buzz-loop.mp3"
};

const OP_INFO = {
  tambah: { label: "Tambah", symbol: "+", color: "coral", english: "Addition" },
  tolak: { label: "Tolak", symbol: "-", color: "mint", english: "Subtraction" },
  darab: { label: "Darab", symbol: "x", color: "lemon", english: "Multiplication" }
};

const LEVELS = {
  mudah: { label: "Mudah", scoreHint: "Nombor kecil" },
  sederhana: { label: "Sederhana", scoreHint: "Nombor sederhana" },
  sukar: { label: "Sukar", scoreHint: "Nombor besar" }
};

let mosquitoSequence = 0;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(op, level) {
  const easy = level === "mudah";
  const hard = level === "sukar";
  let a;
  let b;
  let answer;

  if (op === "tambah") {
    a = easy ? rand(1, 10) : hard ? rand(11, 50) : rand(3, 20);
    b = easy ? rand(1, 10) : hard ? rand(11, 50) : rand(3, 20);
    answer = a + b;
  } else if (op === "tolak") {
    a = easy ? rand(5, 15) : hard ? rand(30, 99) : rand(12, 40);
    b = rand(1, a);
    answer = a - b;
  } else {
    a = easy ? rand(2, 5) : hard ? rand(6, 12) : rand(3, 9);
    b = easy ? rand(2, 5) : hard ? rand(3, 12) : rand(3, 9);
    answer = a * b;
  }

  return { a, b, answer };
}

function makeOptions(correct, op, count) {
  const values = new Set([correct]);
  let guard = 0;
  while (values.size < count && guard < 120) {
    guard += 1;
    const offset = rand(-9, 9);
    if (offset === 0) continue;
    let candidate = correct + offset;
    if (op === "tolak") candidate = Math.max(0, candidate);
    if (candidate >= 0 && !values.has(candidate)) values.add(candidate);
  }
  let list = [...values];
  while (list.length > count) list.splice(rand(0, list.length - 1), 1);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = rand(0, i);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function spawnPosition(fieldSize, size) {
  return {
    x: rand(20, Math.max(40, fieldSize.width - size - 20)),
    y: rand(78, Math.max(100, fieldSize.height - size - 40)),
    vx: (Math.random() * 1.7 + 0.5) * (Math.random() > 0.5 ? 1 : -1),
    vy: (Math.random() * 1.5 + 0.4) * (Math.random() > 0.5 ? 1 : -1),
    wobble: Math.random() * Math.PI * 2
  };
}

function createMosquitoes(question, op, count, fieldSize) {
  const values = makeOptions(question.answer, op, count);
  return values.map((value) => {
    mosquitoSequence += 1;
    const size = rand(92, 118);
    return {
      id: `${Date.now()}-${mosquitoSequence}`,
      value,
      correct: value === question.answer,
      phase: "flying",
      size,
      ...spawnPosition(fieldSize, size)
    };
  });
}

function createSingleMosquito(question, op, fieldSize, aliveValues) {
  let value = question.answer;
  const hasAnswer = aliveValues.includes(question.answer);
  if (hasAnswer) {
    for (let i = 0; i < 30; i += 1) {
      const candidate = Math.max(0, question.answer + rand(-9, 9));
      if (candidate !== question.answer && !aliveValues.includes(candidate)) {
        value = candidate;
        break;
      }
    }
  }
  mosquitoSequence += 1;
  const size = rand(92, 118);
  return {
    id: `${Date.now()}-${mosquitoSequence}`,
    value,
    correct: value === question.answer,
    phase: "flying",
    size,
    ...spawnPosition(fieldSize, size)
  };
}

function FlyingMosquito({ item, disabled, onHit }) {
  const ref = useRef(null);
  const anim = useRef({ x: item.x, y: item.y, vx: item.vx, vy: item.vy, wobble: item.wobble });

  useEffect(() => {
    const el = ref.current;
    if (!el || item.phase !== "flying") return undefined;

    let raf;
    const state = anim.current;
    const step = () => {
      const parent = el.parentElement;
      const width = parent ? parent.clientWidth : 800;
      const height = parent ? parent.clientHeight : 500;
      const size = item.size;

      state.x += state.vx;
      state.y += state.vy;
      state.wobble += 0.07;
      if (state.x < 6) { state.x = 6; state.vx = Math.abs(state.vx); }
      if (state.x > width - size - 6) { state.x = width - size - 6; state.vx = -Math.abs(state.vx); }
      if (state.y < 4) { state.y = 4; state.vy = Math.abs(state.vy); }
      if (state.y > height - size - 4) { state.y = height - size - 4; state.vy = -Math.abs(state.vy); }

      el.style.transform =
        `translate3d(${state.x}px, ${state.y}px, 0) ` +
        `rotate(${Math.sin(state.wobble) * 10}deg)`;
      const sprite = el.querySelector("img");
      if (sprite) {
        sprite.style.transform = `scaleX(${state.vx < 0 ? -1 : 1})`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [item.phase, item.size]);

  const dying = item.phase === "dying";
  const deathClass = dying ? (item.death === "zapper" ? "mos-death-zap" : "mos-death-splat") : "";

  return (
    <button
      ref={ref}
      type="button"
      className={`mos-bug ${dying ? "is-dying" : ""} ${deathClass}`}
      style={{ width: item.size, height: item.size, zIndex: item.correct ? 4 : 2 }}
      onClick={() => { if (!disabled && !dying) onHit(item); }}
      aria-label={`Hempap nyamuk ${item.value}`}
    >
      {dying ? (
        <img src={item.death === "zapper" ? IMAGES.burned : IMAGES.splat} alt="" draggable={false} />
      ) : (
        <img src={IMAGES.fly} alt="" draggable={false} />
      )}
      {!dying && <span className="mos-answer">{item.value}</span>}
    </button>
  );
}

function Floater({ floater }) {
  return (
    <span
      className={`mos-floater ${floater.kind === "bad" ? "is-bad" : ""}`}
      style={{ left: floater.x, top: floater.y }}
    >
      {floater.text}
    </span>
  );
}
export default function MosquitoSplatGame({ initialOp = null }) {
  const [phase, setPhase] = useState("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [op, setOp] = useState(initialOp && OP_INFO[initialOp] ? initialOp : "tambah");
  const [tool, setTool] = useState("swatter");
  const [mode, setMode] = useState("fast");
  const [level, setLevel] = useState("sederhana");
  const [question, setQuestion] = useState(null);
  const [mosquitoes, setMosquitoes] = useState([]);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [countdown, setCountdown] = useState(3);
  const [soundOn, setSoundOn] = useState(true);
  const [shaking, setShaking] = useState(false);
  const [floaters, setFloaters] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef({});
  const fieldRef = useRef(null);
  const correctRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const modeRef = useRef("fast");
  const toolRef = useRef("swatter");
  const phaseRef = useRef("loading");
  const questionRef = useRef(null);
  const opRef = useRef(op);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { correctRef.current = correct; }, [correct]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { opRef.current = op; }, [op]);
  useEffect(() => { questionRef.current = question; }, [question]);

  const playSound = useCallback((name) => {
    if (!soundOn) return;
    const audio = audioRef.current[name];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise) promise.catch(() => {});
    } catch {
      // Audio not ready yet; ignore.
    }
  }, [soundOn]);

  const startAmbient = useCallback(() => {
    const bgm = audioRef.current.bgm;
    const zapBgm = audioRef.current.zapBgm;
    const buzz = audioRef.current.buzzLoop;
    const useZap = toolRef.current === "zapper";
    const active = useZap ? zapBgm : bgm;
    const inactive = useZap ? bgm : zapBgm;
    if (inactive) { inactive.pause(); inactive.currentTime = 0; }
    if (active && soundOn) {
      active.volume = useZap ? 0.07 : 0.08;
      active.loop = true;
      active.play().catch(() => {});
    }
    if (buzz && soundOn) {
      buzz.volume = 0.14;
      buzz.loop = true;
      buzz.play().catch(() => {});
    }
  }, [soundOn]);

  const stopAmbient = useCallback(() => {
    ["bgm", "zapBgm", "buzzLoop"].forEach((name) => {
      const audio = audioRef.current[name];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, []);

  useEffect(() => () => stopAmbient(), [stopAmbient]);

  useEffect(() => {
    let mounted = true;
    let loaded = 0;
    const total = Object.keys(IMAGES).length + Object.keys(SOUNDS).length;

    const imageJobs = Object.values(IMAGES).map((src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    }));

    const audioJobs = Object.entries(SOUNDS).map(([key, src]) => new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.loop = key === "bgm" || key === "buzzLoop" || key === "zapBgm";
      let done = false;
      const finish = () => {
        if (done || !mounted) return;
        done = true;
        audioRef.current[key] = audio;
        loaded += 1;
        setLoadProgress(Math.round((loaded / total) * 100));
        resolve();
      };
      audio.addEventListener("canplaythrough", finish, { once: true });
      audio.addEventListener("loadeddata", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      audio.src = src;
      audio.load();
    }));

    imageJobs.forEach((job) => job.then(() => {
      if (!mounted) return;
      loaded += 1;
      setLoadProgress(Math.round((loaded / total) * 100));
    }));

    Promise.all([...imageJobs, ...audioJobs]).then(() => {
      if (!mounted) return;
      setPhase("menu");
    });

    return () => {
      mounted = false;
      Object.values(audioRef.current).forEach((audio) => audio.pause());
    };
  }, []);

  function addFloater(x, y, text, kind = "good") {
    const id = `${Date.now()}-${Math.random()}`;
    setFloaters((current) => [...current, { id, x: x + 30, y: y + 8, text, kind }]);
    window.setTimeout(() => {
      setFloaters((current) => current.filter((f) => f.id !== id));
    }, 900);
  }

  function beginGame() {
    const nextQuestion = makeQuestion(op, level);
    const size = { width: fieldRef.current?.clientWidth || 900, height: fieldRef.current?.clientHeight || 560 };
    const count = level === "mudah" ? 4 : level === "sederhana" ? 5 : 6;
    const spawns = createMosquitoes(nextQuestion, op, count, size);
    setQuestion(nextQuestion);
    questionRef.current = nextQuestion;
    setMosquitoes(spawns);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setLives(3);
    setCombo(0);
    setBestCombo(0);
    setTimeLeft(mode === "fast" ? 60 : 0);
    setElapsed(0);
    setCountdown(3);
    setPhase("countdown");
    setFloaters([]);
  }

  useEffect(() => {
    if (phase !== "countdown") return undefined;
    if (countdown === 0) {
      setPhase("playing");
      startAmbient();
      return undefined;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 900);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, startAmbient]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const startedAt = Date.now();
    const clock = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      if (modeRef.current === "fast") {
        setTimeLeft((value) => Math.max(0, value - 1));
      }
    }, 1000);

    const spawner = window.setInterval(() => {
      const size = { width: fieldRef.current?.clientWidth || 900, height: fieldRef.current?.clientHeight || 560 };
      const maxBugs = level === "mudah" ? 5 : level === "sederhana" ? 6 : 7;
      const currentQuestion = questionRef.current || makeQuestion(opRef.current, level);
      setMosquitoes((current) => {
        const alive = current.filter((m) => m.phase === "flying");
        if (alive.length >= maxBugs) return current;
        const aliveValues = alive.map((m) => m.value);
        return [...current, createSingleMosquito(currentQuestion, opRef.current, size, aliveValues)];
      });
    }, 4500);

    return () => {
      window.clearInterval(clock);
      window.clearInterval(spawner);
    };
  }, [phase, level, stopAmbient]);

  const finishGame = useCallback(() => {
    setPhase("over");
    stopAmbient();
  }, [stopAmbient]);

  useEffect(() => {
    if (phase === "playing" && mode === "fast" && timeLeft <= 0) {
      finishGame();
    }
  }, [phase, mode, timeLeft, finishGame]);

  function handleHit(item) {
    if (phaseRef.current !== "playing" || item.phase !== "flying") return;
    const currentTool = toolRef.current;

    if (item.correct) {
      playSound(currentTool === "zapper" ? "zap" : "slap");
      const nextCombo = comboRef.current + 1;
      const gained = 10 * Math.min(nextCombo, 5);
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      setBestCombo((best) => Math.max(best, nextCombo));
      setScore((value) => value + gained);
      const nextCorrect = correctRef.current + 1;
      correctRef.current = nextCorrect;
      setCorrect(nextCorrect);
      addFloater(item.x, item.y, `+${gained}`);

      setMosquitoes((current) => current.map((m) => (
        m.id === item.id ? { ...m, phase: "dying", death: currentTool } : m
      )));


      window.setTimeout(() => {
        setMosquitoes((current) => current.filter((m) => m.id !== item.id));
      }, 3200);
      window.setTimeout(() => {
        const nextQuestion = makeQuestion(opRef.current, level);
        questionRef.current = nextQuestion;
        setQuestion(nextQuestion);
        const size = { width: fieldRef.current?.clientWidth || 900, height: fieldRef.current?.clientHeight || 560 };
        const count = level === "mudah" ? 4 : level === "sederhana" ? 5 : 6;
        const fresh = createMosquitoes(nextQuestion, opRef.current, count, size);
        setMosquitoes((current) => [...current.filter((m) => m.phase !== "flying"), ...fresh]);
      }, 680);

      if (modeRef.current === "relaxed" && nextCorrect >= 15) {
        window.setTimeout(finishGame, 500);
      }
    } else {
      playSound("buzzFly");
      comboRef.current = 0;
      setCombo(0);
      setWrong((value) => value + 1);
      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(nextLives);
      setShaking(true);
      window.setTimeout(() => setShaking(false), 450);
      addFloater(item.x, item.y, "Salah!", "bad");
      if (nextLives <= 0) {
        window.setTimeout(finishGame, 450);
      }
    }
  }

  function toggleSound() {
    setSoundOn((current) => {
      const next = !current;
      if (next) {
        if (phaseRef.current === "playing") startAmbient();
      } else {
        stopAmbient();
      }
      return next;
    });
  }

  const opInfo = OP_INFO[op];
  const accuracy = correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0;
  return (
    <main className="mos-app">
      <header className="mos-topbar">
        <a className="mos-home-link" href="/" aria-label="Kembali ke ruang belajar">
          <ArrowLeft size={17} /> <span>Ruang</span>
        </a>
        <div className="mos-brand">
          <Bug size={19} />
          <strong>Hempaplah Nyamuk!</strong>
        </div>
        <button className="mos-sound-button" type="button" onClick={toggleSound} aria-label={soundOn ? "Matikan bunyi" : "Hidupkan bunyi"}>
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </header>

      {phase === "loading" && (
        <section className="mos-screen mos-loading" aria-live="polite">
          <div className="mos-loading-logo">
            <img src={IMAGES.fly} alt="" />
            <img className="mos-loading-splat" src={IMAGES.splat} alt="" />
          </div>
          <h1>Menyediakan permainan...</h1>
          <p>Memuatkan gambar dan bunyi nyamuk.</p>
          <div className="mos-progress" role="progressbar" aria-valuenow={loadProgress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${loadProgress}%` }} />
          </div>
          <strong className="mos-progress-label">{loadProgress}%</strong>
        </section>
      )}

      {phase === "menu" && (
        <section className="mos-screen mos-menu">
          <div className="mos-menu-hero">
            <div className="mos-menu-bugs" aria-hidden="true">
              <img src={IMAGES.fly} alt="" />
              <img src={IMAGES.swatter} alt="" />
              <img src={IMAGES.zapper} alt="" />
            </div>
            <span className="mos-menu-kicker">Permainan Matematik</span>
            <h1>Hempaplah Nyamuk!</h1>
            <p>Kira jawapan, hempap nyamuk yang betul sebelum dia terbang!</p>
          </div>

          <div className="mos-menu-panel">
            <div className="mos-option-group">
              <h2><Target size={16} /> Operasi</h2>
              <div className="mos-option-row mos-op-row">
                {Object.entries(OP_INFO).map(([id, info]) => (
                  <button
                    key={id}
                    type="button"
                    className={`mos-option-card mos-op-${info.color} ${op === id ? "is-selected" : ""}`}
                    onClick={() => setOp(id)}
                    aria-pressed={op === id}
                  >
                    <strong>{info.symbol}</strong>
                    <span>{info.label}</span>
                    <em>{info.english}</em>
                  </button>
                ))}
              </div>
            </div>

            <div className="mos-option-group">
              <h2><Zap size={16} /> Alat</h2>
              <div className="mos-option-row mos-tool-row">
                <button
                  type="button"
                  className={`mos-tool-card ${tool === "swatter" ? "is-selected" : ""}`}
                  onClick={() => setTool("swatter")}
                  aria-pressed={tool === "swatter"}
                >
                  <img src={IMAGES.swatter} alt="" />
                  <span><strong>Pemukul</strong><em>lekit + darah</em></span>
                </button>
                <button
                  type="button"
                  className={`mos-tool-card ${tool === "zapper" ? "is-selected" : ""}`}
                  onClick={() => setTool("zapper")}
                  aria-pressed={tool === "zapper"}
                >
                  <img src={IMAGES.zapper} alt="" />
                  <span><strong>Pemukul elektrik</strong><em>Zzzap! hangus</em></span>
                </button>
              </div>
            </div>

            <div className="mos-option-group">
              <h2><Clock3 size={16} /> Cara bermain</h2>
              <div className="mos-option-row mos-mode-row">
                <button
                  type="button"
                  className={`mos-mode-card ${mode === "fast" ? "is-selected" : ""}`}
                  onClick={() => setMode("fast")}
                  aria-pressed={mode === "fast"}
                >
                  <Timer size={19} />
                  <span><strong>Cepat</strong><em>60 saat, skor tinggi</em></span>
                </button>
                <button
                  type="button"
                  className={`mos-mode-card ${mode === "relaxed" ? "is-selected" : ""}`}
                  onClick={() => setMode("relaxed")}
                  aria-pressed={mode === "relaxed"}
                >
                  <Sparkles size={19} />
                  <span><strong>Santai</strong><em>15 betul, tiada masa</em></span>
                </button>
              </div>
            </div>

            <div className="mos-option-group">
              <h2><Target size={16} /> Tahap</h2>
              <div className="mos-option-row mos-level-row">
                {Object.entries(LEVELS).map(([id, info]) => (
                  <button
                    key={id}
                    type="button"
                    className={`mos-level-card ${level === id ? "is-selected" : ""}`}
                    onClick={() => setLevel(id)}
                    aria-pressed={level === id}
                  >
                    <strong>{info.label}</strong>
                    <em>{info.scoreHint}</em>
                  </button>
                ))}
              </div>
            </div>

            <button className="mos-start-button" type="button" onClick={beginGame}>
              <Play size={19} fill="currentColor" /> Mula! <ArrowRight size={17} />
            </button>
          </div>
        </section>
      )}

      {phase !== "menu" && phase !== "loading" && (
        <section className={`mos-hud ${opInfo.color}`} aria-label="Skor permainan">
          <div className="mos-hud-item mos-hud-score">
            <span>Skor</span>
            <strong>{score}</strong>
          </div>
          <div className="mos-hud-item mos-hud-combo">
            <span>Kombo</span>
            <strong className={combo >= 2 ? "is-hot" : ""}>
              {combo >= 2 ? <><Flame size={15} fill="currentColor" /> {combo}x</> : <>{combo}x</>}
            </strong>
          </div>
          <div className="mos-hud-item mos-hud-lives" aria-label={`Nyawa ${lives}`}>
            <span>Nyawa</span>
            <strong>
              {Array.from({ length: 3 }, (_, i) => (
                i < lives
                  ? <Heart key={i} size={16} fill="currentColor" />
                  : <HeartCrack key={i} size={16} />
              ))}
            </strong>
          </div>
          {mode === "fast" ? (
            <div className={`mos-hud-item mos-hud-timer ${timeLeft <= 10 ? "is-low" : ""}`}>
              <span>Masa</span>
              <strong>{timeLeft}s</strong>
            </div>
          ) : (
            <div className="mos-hud-item mos-hud-target">
              <span>Sasaran</span>
              <strong>{Math.min(correct, 15)}/15</strong>
            </div>
          )}
        </section>
      )}

      {phase === "playing" && (
        <section className={`mos-field mos-field-${opInfo.color} mos-field-${tool} ${shaking ? "is-shaking" : ""}`} ref={fieldRef} aria-label="Kawasan nyamuk">
          <div className="mos-question" aria-live="polite">
            <span className="mos-question-op">{opInfo.symbol}</span>
            <strong>{question ? `${question.a} ${opInfo.symbol} ${question.b} = ?` : "..."}</strong>
          </div>
          {mosquitoes.map((item) => (
            <FlyingMosquito key={item.id} item={item} disabled={false} onHit={handleHit} />
          ))}
          {floaters.map((floater) => <Floater key={floater.id} floater={floater} />)}
          <p className="mos-field-hint">Kira jawapan, kemudian tekan nyamuk yang betul!</p>
        </section>
      )}

      {phase === "countdown" && (
        <section className="mos-field mos-field-preview" aria-live="assertive">
          <div className="mos-countdown" key={countdown}>
            <span>{countdown || "Mula!"}</span>
          </div>
        </section>
      )}

      {phase === "over" && (
        <section className="mos-screen mos-results" aria-live="polite">
          <div className="mos-results-card">
            <div className="mos-results-bugs" aria-hidden="true">
              <img src={tool === "zapper" ? IMAGES.burned : IMAGES.splat} alt="" />
              <img src={IMAGES.fly} alt="" />
            </div>
            <span className="mos-menu-kicker">Permainan tamat</span>
            <h1>{bestCombo >= 8 ? "Wah! Juara Nyamuk!" : bestCombo >= 4 ? "Hebat sangat!" : "Bagus, cuba lagi!"}</h1>
            <div className="mos-results-score">
              <span>Skor akhir</span>
              <strong>{score}</strong>
            </div>
            <div className="mos-results-grid">
              <div><span>Betul</span><strong>{correct}</strong></div>
              <div><span>Salah</span><strong>{wrong}</strong></div>
              <div><span>Ketepatan</span><strong>{accuracy}%</strong></div>
              <div><span>Kombo terbaik</span><strong>{bestCombo}x</strong></div>
              <div><span>Masa</span><strong>{elapsed}s</strong></div>
              <div><span>Operasi</span><strong>{opInfo.symbol} {opInfo.label}</strong></div>
            </div>
            <div className="mos-results-actions">
              <button className="mos-replay-button" type="button" onClick={beginGame}>
                <RotateCcw size={18} /> Main lagi
              </button>
              <button className="mos-menu-button" type="button" onClick={() => setPhase("menu")}>
                Tukar tetapan <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
