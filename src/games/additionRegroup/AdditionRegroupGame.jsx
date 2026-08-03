import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Music,
  Plus,
  Sparkles,
  Undo2,
  Volume2,
  X
} from "lucide-react";

const DEFAULT_PROBLEM = { n1: 28, n2: 47 };
let blockSequence = 0;

function makeBlock(type, row = "carry", col = type) {
  blockSequence += 1;
  return { id: `${Date.now()}-${blockSequence}`, type, row, col };
}

function getDigits(value) {
  return {
    H: Math.floor(value / 100),
    T: Math.floor(value / 10) % 10,
    O: value % 10
  };
}

function getCarryFlags(n1, n2) {
  const first = getDigits(n1);
  const second = getDigits(n2);
  const ones = first.O + second.O >= 10;
  const tens = first.T + second.T + (ones ? 1 : 0) >= 10;
  return { ones, tens };
}

function generateProblem(level, groupingMode, previousTop = null) {
  const maxValue = level === "100" ? 99 : 999;

  for (let attempt = 0; attempt < 180; attempt += 1) {
    const n1 = level === "100"
      ? Math.floor(Math.random() * 76) + 12
      : Math.floor(Math.random() * 760) + 120;
    const n2 = Math.floor(Math.random() * Math.max(1, maxValue - n1)) + 1;
    if (n1 === previousTop || n1 + n2 > maxValue) continue;

    const carries = getCarryFlags(n1, n2);
    const regrouping = carries.ones || (level === "1000" && carries.tens);
    if (groupingMode === "no-grouping" && regrouping) continue;
    if (groupingMode === "grouping" && !regrouping) continue;
    return { n1, n2 };
  }

  if (level === "100") {
    if (groupingMode === "no-grouping") return { n1: 34, n2: 25 };
    if (groupingMode === "grouping") return { n1: 28, n2: 47 };
    return { ...DEFAULT_PROBLEM };
  }
  if (groupingMode === "no-grouping") return { n1: 243, n2: 516 };
  if (groupingMode === "grouping") return { n1: 276, n2: 485 };
  return { n1: 276, n2: 485 };
}

function blockName(type) {
  return type === "H" ? "Hundreds" : type === "T" ? "Tens" : "Ones";
}

function BlockOne() {
  return <span className="arg-block arg-block-one" aria-hidden="true" />;
}

function BlockTen() {
  return <span className="arg-block arg-block-ten" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</span>;
}

function BlockHundred() {
  return <span className="arg-block arg-block-hundred" aria-hidden="true">{Array.from({ length: 100 }, (_, index) => <i key={index} />)}</span>;
}

function BlockVisual({ type }) {
  if (type === "H") return <BlockHundred />;
  if (type === "T") return <BlockTen />;
  return <BlockOne />;
}

function BlockCard({ row, type, target, count, onClick, onDragStart, disabled }) {
  const label = blockName(type);
  const numberLabel = row === "build1" ? "first number" : "second number";
  return (
    <button
      className={`arg-bank-card arg-bank-card-${type.toLowerCase()}`}
      type="button"
      draggable={!disabled}
      disabled={disabled}
      onDragStart={(event) => onDragStart(event, type, row)}
      onClick={onClick}
      aria-label={`Add ${label} to ${numberLabel}`}
    >
      <span className="arg-bank-visual"><BlockVisual type={type} /></span>
      <span className="arg-bank-card-copy"><strong>{label}</strong><small>{count} / {target}</small></span>
    </button>
  );
}

function MathPanel({ phase, level, problem, carryValues, inputs, focusedCell, onFocus, onSubmit, onKeypadPress }) {
  const first = getDigits(problem.n1);
  const second = getDigits(problem.n2);
  const answerCells = [
    { id: "H", value: inputs.H, label: "Hundreds answer", tone: "h", disabled: level === "100" },
    { id: "T", value: inputs.T, label: "Tens answer", tone: "t", disabled: false },
    { id: "O", value: inputs.O, label: "Ones answer", tone: "o", disabled: false }
  ];

  return (
    <aside className={`arg-math-panel ${phase === "build" || phase === "carry" ? "is-locked" : ""}`}>
      <div className="arg-panel-title">Vertical format</div>
      <div className="arg-panel-scroll">
        <div className="arg-equation-card">
          <div className="arg-panel-equation-grid" aria-label="Vertical addition equation">
            <span />
            <span className="arg-carry-cell arg-tone-h">{level === "1000" ? carryValues.H || "" : ""}</span>
            <span className="arg-carry-cell arg-tone-t">{carryValues.T || ""}</span>
            <span className="arg-carry-cell arg-tone-o" aria-hidden="true" />

            <span />
            <strong className="arg-math-digit arg-tone-h-text">{level === "1000" ? first.H || "" : ""}</strong>
            <strong className="arg-math-digit arg-tone-t-text">{first.T}</strong>
            <strong className="arg-math-digit arg-tone-o-text">{first.O}</strong>

            <span className="arg-plus-symbol"><Plus size={24} strokeWidth={4} /></span>
            <strong className="arg-math-digit arg-tone-h-text">{level === "1000" ? second.H || "" : ""}</strong>
            <strong className="arg-math-digit arg-tone-t-text">{second.T}</strong>
            <strong className="arg-math-digit arg-tone-o-text">{second.O}</strong>

            <span className="arg-answer-line" />
            <span className="arg-answer-line" />
            <span className="arg-answer-line" />
            <span className="arg-answer-line" />

            <span />
            {answerCells.map((cell) => (
              <button
                className={`arg-answer-cell arg-tone-${cell.tone} ${focusedCell === cell.id ? "is-focused" : ""}`}
                type="button"
                key={cell.id}
                disabled={phase !== "solve" || cell.disabled}
                onClick={() => onFocus(cell.id)}
                aria-label={cell.label}
              >
                {cell.value}
              </button>
            ))}
          </div>

          <button className="arg-submit-button" type="button" onClick={onSubmit} disabled={phase !== "solve"}>
            Check answer <Check size={18} strokeWidth={3} />
          </button>
        </div>

        {focusedCell && phase === "solve" && (
          <div className="arg-keypad" role="dialog" aria-label="Select number">
            <div className="arg-keypad-heading">
              <span>{focusedCell === "O" ? "Ones" : focusedCell === "T" ? "Tens" : "Hundreds"}</span>
              <button type="button" onClick={() => onFocus(null)} aria-label="Close number picker"><X size={18} /></button>
            </div>
            <div className="arg-keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <button type="button" key={number} onClick={() => onKeypadPress(String(number))}>{number}</button>
              ))}
              <button className="is-delete" type="button" onClick={() => onKeypadPress("DEL")}>DEL</button>
              <button type="button" onClick={() => onKeypadPress("0")}>0</button>
              <button className="is-done" type="button" onClick={() => onFocus(null)} aria-label="Close number picker"><Check size={17} /></button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function tone(context, frequency, duration, type = "sine", volume = 0.12) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function AdditionRegroupGame() {
  const [level, setLevel] = useState("100");
  const [groupingMode, setGroupingMode] = useState("mixed");
  const [problem, setProblem] = useState(DEFAULT_PROBLEM);
  const [phase, setPhase] = useState("build");
  const [blocks, setBlocks] = useState([]);
  const [carryValues, setCarryValues] = useState({ H: 0, T: 0 });
  const [history, setHistory] = useState([]);
  const [showBuildClue, setShowBuildClue] = useState(false);
  const [showCarryReminder, setShowCarryReminder] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [inputs, setInputs] = useState({ H: "", T: "", O: "" });
  const [focusedCell, setFocusedCell] = useState(null);
  const [musicMode, setMusicMode] = useState("off");
  const [round, setRound] = useState(1);
  const audioContextRef = useRef(null);
  const errorTimerRef = useRef(null);
  const musicTimerRef = useRef(null);

  const firstTarget = useMemo(() => getDigits(problem.n1), [problem.n1]);
  const secondTarget = useMemo(() => getDigits(problem.n2), [problem.n2]);
  const expectedCarries = useMemo(() => getCarryFlags(problem.n1, problem.n2), [problem.n1, problem.n2]);
  const expectedAnswer = getDigits(problem.n1 + problem.n2);

  useEffect(() => () => {
    window.clearTimeout(errorTimerRef.current);
    window.clearInterval(musicTimerRef.current);
  }, []);

  useEffect(() => {
    if (musicMode === "off") {
      window.clearInterval(musicTimerRef.current);
      return undefined;
    }
    const context = getAudioContext();
    if (!context) return undefined;
    const notes = musicMode === "peaceful" ? [392, 440, 523.25, 587.33, 659.25] : [261.63, 329.63, 392, 523.25];
    let noteIndex = 0;
    musicTimerRef.current = window.setInterval(() => {
      tone(context, notes[noteIndex % notes.length], musicMode === "peaceful" ? 1.6 : .24, musicMode === "peaceful" ? "sine" : "square", musicMode === "peaceful" ? .04 : .035);
      noteIndex += 1;
    }, musicMode === "peaceful" ? 650 : 260);
    return () => window.clearInterval(musicTimerRef.current);
  }, [musicMode]);

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
    if (audioContextRef.current.state === "suspended") audioContextRef.current.resume();
    return audioContextRef.current;
  }

  function playSound(type) {
    const context = getAudioContext();
    if (!context) return;
    if (type === "drop") tone(context, 400, .1, "sine", .1);
    if (type === "merge") {
      tone(context, 320, .12, "triangle", .1);
      window.setTimeout(() => tone(context, 680, .16, "triangle", .09), 70);
    }
    if (type === "error") tone(context, 110, .2, "sawtooth", .08);
    if (type === "success") [440, 554.37, 659.25, 880].forEach((frequency, index) => window.setTimeout(() => tone(context, frequency, .3, "triangle", .1), index * 110));
  }

  function toggleMusic() {
    getAudioContext();
    setMusicMode((current) => current === "off" ? "peaceful" : current === "peaceful" ? "exciting" : "off");
  }

  function startProblem(nextLevel = level, nextGroupingMode = groupingMode) {
    setProblem(generateProblem(nextLevel, nextGroupingMode, problem.n1));
    setLevel(nextLevel);
    setGroupingMode(nextGroupingMode);
    setPhase("build");
    setBlocks([]);
    setCarryValues({ H: 0, T: 0 });
    setHistory([]);
    setInputs({ H: "", T: "", O: "" });
    setFocusedCell(null);
    setShowCarryReminder(false);
    setErrorMsg("");
    setRound((current) => current + 1);
  }

  function saveState() {
    setHistory((current) => [...current, { blocks: [...blocks], carryValues: { ...carryValues } }]);
  }

  function handleUndo() {
    const lastState = history[history.length - 1];
    if (!lastState || phase !== "build") return;
    setBlocks(lastState.blocks);
    setCarryValues(lastState.carryValues || { H: 0, T: 0 });
    setHistory((current) => current.slice(0, -1));
  }

  function triggerError(message = "Build each number in its matching space.") {
    setErrorMsg(message);
    playSound("error");
    window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setErrorMsg(""), 2600);
  }

  function handleDragStart(event, type, row) {
    event.dataTransfer.setData("text/plain", JSON.stringify({ type, row }));
    event.dataTransfer.effectAllowed = "copy";
  }

  function addBankBlock(type, row) {
    if (phase !== "build") return;
    const target = row === "build1" ? firstTarget : secondTarget;
    const count = blocks.filter((block) => block.row === row && block.type === type).length;
    if (count >= target[type]) return;
    saveState();
    setBlocks((current) => [...current, makeBlock(type, row, type)]);
    playSound("drop");
  }

  function handleDrop(event, row) {
    event.preventDefault();
    if (phase !== "build") return;
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if (!data || data.row !== row) {
      triggerError("Use the block bank for the matching number.");
      return;
    }
    addBankBlock(data.type, row);
  }

  function handleBlockClick(block) {
    if (phase !== "build") return;
    saveState();
    setBlocks((current) => current.filter((entry) => entry.id !== block.id));
    playSound("drop");
  }

  function mergeBlocks(type) {
    if (phase !== "carry") return;
    const eligible = blocks.filter((block) => (block.row === "build1" || block.row === "build2") && block.type === type).slice(0, 10);
    if (eligible.length < 10) {
      triggerError(`You need 10 ${type === "O" ? "ones" : "tens"} first.`);
      return;
    }

    const ids = new Set(eligible.map((block) => block.id));
    const carryType = type === "O" ? "T" : "H";
    setBlocks((current) => [...current.filter((block) => !ids.has(block.id)), makeBlock(carryType, "carry", carryType)]);
    setCarryValues((current) => ({ ...current, [carryType]: 1 }));
    playSound("merge");
  }

  function startSolving() {
    const carryReady = (!expectedCarries.ones || carryValues.T === 1) && (!expectedCarries.tens || carryValues.H === 1);
    if (!carryReady) {
      triggerError("Complete the regrouping buttons before solving.");
      return;
    }
    setPhase("solve");
    setShowCarryReminder(false);
    setInputs({ H: "", T: "", O: "" });
    setFocusedCell(null);
  }

  function handleCellFocus(cellId) {
    if (!cellId) {
      setFocusedCell(null);
      return;
    }
    if (phase !== "solve") {
      triggerError("Build the blocks and regroup before solving.");
      return;
    }
    if (cellId === "T" && inputs.O !== String(expectedAnswer.O)) {
      triggerError("Solve the Ones first.");
      return;
    }
    if (cellId === "H" && inputs.T !== String(expectedAnswer.T)) {
      triggerError("Solve the Tens first.");
      return;
    }
    setFocusedCell(cellId);
  }

  function handleKeypadPress(value) {
    if (!focusedCell) return;
    if (value === "DEL") setInputs((current) => ({ ...current, [focusedCell]: "" }));
    else {
      setInputs((current) => ({ ...current, [focusedCell]: value }));
      setFocusedCell(null);
    }
  }

  function handleSubmit() {
    setFocusedCell(null);
    const isCorrect = inputs.O === String(expectedAnswer.O)
      && inputs.T === String(expectedAnswer.T)
      && (level === "100" || inputs.H === String(expectedAnswer.H));
    if (isCorrect) {
      setPhase("success");
      playSound("success");
      return;
    }
    triggerError("Check the place values and try again.");
  }

  useEffect(() => {
    if (phase !== "build") return undefined;
    const counts = { build1: { H: 0, T: 0, O: 0 }, build2: { H: 0, T: 0, O: 0 } };
    blocks.forEach((block) => {
      if (counts[block.row]) counts[block.row][block.type] += 1;
    });
    const firstDone = Object.keys(counts.build1).every((type) => counts.build1[type] === firstTarget[type]);
    const secondDone = Object.keys(counts.build2).every((type) => counts.build2[type] === secondTarget[type]);
    if (!firstDone || !secondDone) return undefined;
    const timer = window.setTimeout(() => {
      setPhase("carry");
      setShowCarryReminder(true);
      setHistory([]);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [blocks, phase, firstTarget, secondTarget]);

  const buildCounts = {
    build1: { H: 0, T: 0, O: 0 },
    build2: { H: 0, T: 0, O: 0 }
  };
  blocks.forEach((block) => {
    if (buildCounts[block.row]) buildCounts[block.row][block.type] += 1;
  });

  const carryReady = (!expectedCarries.ones || carryValues.T === 1) && (!expectedCarries.tens || carryValues.H === 1);
  const showMergeOnes = expectedCarries.ones && carryValues.T === 0;
  const showMergeTens = expectedCarries.tens && carryValues.H === 0;
  const blockTypes = level === "100" ? ["T", "O"] : ["H", "T", "O"];

  function renderZone(row, type) {
    const zoneBlocks = blocks.filter((block) => block.row === row && block.type === type);
    return (
      <div
        className={`arg-zone arg-zone-${type.toLowerCase()}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event, row)}
      >
        <span className="arg-zone-label">{blockName(type)}</span>
        <div className="arg-zone-blocks">{zoneBlocks.map((block) => (
          <button
            className="arg-mat-block"
            type="button"
            key={block.id}
            draggable={phase === "build"}
            onClick={() => handleBlockClick(block)}
            title={phase === "build" ? "Click to remove" : blockName(block.type)}
            aria-label={`${blockName(block.type)} block`}
          >
            <BlockVisual type={block.type} />
          </button>
        ))}</div>
      </div>
    );
  }

  function renderBankSection(row, label, number) {
    const target = getDigits(number);
    return (
      <section className="arg-bank-section" aria-label={`${label} block bank`}>
        <div className="arg-bank-section-heading"><span>{label}</span><strong>{number}</strong></div>
        <div className="arg-bank-cards">
          {blockTypes.map((type) => (
            <BlockCard
              key={`${row}-${type}`}
              row={row}
              type={type}
              target={target[type]}
              count={buildCounts[row][type]}
              disabled={phase !== "build" || buildCounts[row][type] >= target[type]}
              onClick={() => addBankBlock(type, row)}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="arg-app">
      <header className="arg-topbar">
        <a className="arg-home-link" href="/" aria-label="Back to learning space"><ArrowLeft size={17} /> <span>Learning space</span></a>
        <div className="arg-equation-pill" aria-label={`${problem.n1} plus ${problem.n2}`}>
          <strong>{problem.n1} + {problem.n2} = </strong><span>{phase === "success" ? problem.n1 + problem.n2 : "?"}</span>
        </div>
        <div className="arg-controls">
          <label><span className="sr-only">Number range</span><select value={level} onChange={(event) => startProblem(event.target.value, groupingMode)}><option value="100">Under 100</option><option value="1000">Under 1000</option></select></label>
          <label><span className="sr-only">Regrouping mode</span><select value={groupingMode} onChange={(event) => startProblem(level, event.target.value)}><option value="no-grouping">No Regroup</option><option value="mixed">Mixed</option><option value="grouping">Force Regroup</option></select></label>
          <button className="arg-music-button" type="button" onClick={toggleMusic} title="Toggle background music"><Music size={16} /><span>{musicMode === "peaceful" ? "Peaceful" : musicMode === "exciting" ? "Exciting" : "Off"}</span></button>
        </div>
      </header>

      <div className="arg-game-body">
        <aside className="arg-bank">
          <div className="arg-bank-title">Block bank</div>
          <div className="arg-bank-content">
            <div className="arg-bank-heading"><span>Click or drag</span><button type="button" onClick={() => setShowBuildClue(true)} aria-label="Open help" title="Help"><CircleHelp size={16} /></button></div>
            {renderBankSection("build1", "First number", problem.n1)}
            {renderBankSection("build2", "Second number", problem.n2)}
            <button className="arg-undo-button" type="button" onClick={handleUndo} disabled={history.length === 0 || phase !== "build"}><Undo2 size={17} /> Undo build</button>
          </div>
        </aside>

        <section className="arg-mat-board" aria-label="Place value work area">
          <div className="arg-carry-zone">
            <div className="arg-board-row-heading"><span>Carry zone</span><small>{carryValues.H || carryValues.T ? "Regrouped blocks" : "Complete the numbers, then regroup"}</small></div>
            <div className="arg-carry-blocks">
              {blocks.filter((block) => block.row === "carry").map((block) => <span className="arg-carry-block" key={block.id}><BlockVisual type={block.type} /></span>)}
              {!blocks.some((block) => block.row === "carry") && <span className="arg-carry-empty">-</span>}
            </div>
          </div>

          <div className="arg-number-row">
            <div className="arg-number-row-heading"><span>First number</span><strong>{problem.n1}</strong></div>
            <div className="arg-zone-row">{blockTypes.map((type) => <div key={`build1-${type}`}>{renderZone("build1", type)}</div>)}</div>
          </div>
          <div className="arg-number-row">
            <div className="arg-number-row-heading"><span>Second number</span><strong>{problem.n2}</strong></div>
            <div className="arg-zone-row">{blockTypes.map((type) => <div key={`build2-${type}`}>{renderZone("build2", type)}</div>)}</div>
          </div>

          <div className="arg-merge-bar">
            {phase === "build" && <span className="arg-board-hint"><Sparkles size={15} /> Build both numbers with blocks.</span>}
            {phase === "carry" && showMergeTens && <button className="arg-merge-button arg-merge-h" type="button" onClick={() => mergeBlocks("T")}><span>10 tens</span><ArrowRight size={15} /><span>1 hundred</span></button>}
            {phase === "carry" && showMergeOnes && <button className="arg-merge-button arg-merge-o" type="button" onClick={() => mergeBlocks("O")}><span>10 ones</span><ArrowRight size={15} /><span>1 ten</span></button>}
            {phase === "carry" && !showMergeTens && !showMergeOnes && <button className="arg-start-button" type="button" onClick={startSolving}>Start solving <ArrowRight size={17} /></button>}
            {phase === "carry" && carryReady && (showMergeTens || showMergeOnes) && <button className="arg-start-button" type="button" onClick={startSolving}>Start solving <ArrowRight size={17} /></button>}
            {phase === "solve" && <span className="arg-board-hint"><Plus size={15} /> Solve from Ones to Hundreds.</span>}
            {phase === "success" && <span className="arg-board-success"><Check size={16} /> Correct. Nice work.</span>}
          </div>
        </section>

        <MathPanel
          phase={phase}
          level={level}
          problem={problem}
          carryValues={carryValues}
          inputs={inputs}
          focusedCell={focusedCell}
          onFocus={handleCellFocus}
          onSubmit={handleSubmit}
          onKeypadPress={handleKeypadPress}
        />
      </div>

      <footer className="arg-footer"><span><Volume2 size={15} /> Round {round} - build, regroup, solve.</span><a href="/" aria-label="Return to maths selection"><ArrowRight size={15} /> Maths</a></footer>

      {errorMsg && <div className="arg-error-toast" role="alert"><X size={21} /> <span>{errorMsg}</span></div>}

      {(showBuildClue || showCarryReminder || phase === "success") && (
        <div className="arg-overlay">
          <div className={`arg-overlay-card ${phase === "success" ? "is-success" : ""}`} role="dialog" aria-modal="true" aria-labelledby="arg-overlay-title">
            {phase !== "success" && <button className="arg-overlay-close" type="button" onClick={() => { setShowBuildClue(false); setShowCarryReminder(false); }} aria-label="Close"><X size={18} /></button>}
            <div className="arg-overlay-mark">{phase === "success" ? <Check size={28} /> : showCarryReminder ? <Sparkles size={28} /> : <CircleHelp size={28} />}</div>
            <h2 id="arg-overlay-title">{phase === "success" ? "Correct!" : showCarryReminder ? "Numbers built" : "Build the addition"}</h2>
            <p>{phase === "success" ? `${problem.n1} + ${problem.n2} = ${problem.n1 + problem.n2}.` : showCarryReminder ? (showMergeTens || showMergeOnes ? "Combine groups of ten before you write the answer." : "No regrouping is needed for this question.") : "Click or drag blocks into the matching space for each number."}</p>
            {phase === "success" ? (
              <button className="arg-overlay-action" type="button" onClick={() => startProblem(level, groupingMode)}>Next question <ArrowRight size={18} /></button>
            ) : showCarryReminder ? (
              <button className="arg-overlay-action" type="button" onClick={() => { setShowCarryReminder(false); if (!showMergeTens && !showMergeOnes) startSolving(); }}>Continue <ArrowRight size={18} /></button>
            ) : (
              <button className="arg-overlay-action" type="button" onClick={() => setShowBuildClue(false)}>Got it <ArrowRight size={18} /></button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default AdditionRegroupGame;
