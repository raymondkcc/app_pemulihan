import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Minus,
  Music,
  RotateCcw,
  Trash2,
  Undo2,
  Volume2,
  X
} from "lucide-react";

const DEFAULT_PROBLEM = { n1: 603, n2: 536 };
let blockSequence = 0;

function makeBlock(type, row, col) {
  blockSequence += 1;
  return { id: `${Date.now()}-${blockSequence}`, type, row, col };
}

function BlockOne() {
  return <span className="mrg-block mrg-block-one" aria-hidden="true" />;
}

function BlockTen() {
  return <span className="mrg-block mrg-block-ten" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</span>;
}

function BlockHundred() {
  return <span className="mrg-block mrg-block-hundred" aria-hidden="true">{Array.from({ length: 100 }, (_, index) => <i key={index} />)}</span>;
}

function BlockVisual({ type }) {
  if (type === "H") return <BlockHundred />;
  if (type === "T") return <BlockTen />;
  return <BlockOne />;
}

function blockName(type) {
  return type === "H" ? "Hundreds" : type === "T" ? "Tens" : "Ones";
}

function getDigits(value) {
  return {
    H: Math.floor(value / 100),
    T: Math.floor(value / 10) % 10,
    O: value % 10
  };
}

function needsRegrouping(n1, n2, level) {
  const first = getDigits(n1);
  const second = getDigits(n2);
  const needsOnes = first.O < second.O;
  const needsTens = first.T - (needsOnes ? 1 : 0) < second.T;
  return needsOnes || (level === "1000" && needsTens);
}

function generateProblem(level, groupingMode, previousTop = null) {
  const maxValue = level === "100" ? 99 : 999;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const n1 = Math.floor(Math.random() * (maxValue - 20)) + 20;
    const n2 = Math.floor(Math.random() * Math.max(1, n1 - 10)) + 1;
    if (n1 === previousTop || n2 >= n1) continue;

    const regrouping = needsRegrouping(n1, n2, level);
    if (groupingMode === "no-grouping" && regrouping) continue;
    if (groupingMode === "grouping" && !regrouping) continue;
    return { n1, n2 };
  }

  if (level === "100") return groupingMode === "no-grouping" ? { n1: 86, n2: 32 } : { n1: 73, n2: 28 };
  return groupingMode === "no-grouping" ? { n1: 845, n2: 312 } : { n1: 603, n2: 536 };
}

function expectedAnswers(problem) {
  let { H: h1, T: t1, O: o1 } = getDigits(problem.n1);
  const { H: h2, T: t2, O: o2 } = getDigits(problem.n2);

  if (o1 < o2) {
    o1 += 10;
    t1 -= 1;
  }
  const answerO = o1 - o2;

  if (t1 < t2) {
    t1 += 10;
    h1 -= 1;
  }
  const answerT = t1 - t2;
  const answerH = h1 - h2;

  return {
    a_H: answerH > 0 ? String(answerH) : "",
    a_T: answerH > 0 || answerT > 0 ? String(answerT) : "",
    a_O: String(answerO)
  };
}

function displayAnswerValue(expected, key) {
  return expected[key] || "";
}

function tone(context, frequency, duration, type = "sine", volume = 0.14) {
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

function BlockCard({ type, onClick, onDragStart, label }) {
  return (
    <button
      className={`mrg-bank-card mrg-bank-card-${type.toLowerCase()}`}
      type="button"
      draggable="true"
      onDragStart={(event) => onDragStart(event, type, "bank")}
      onClick={onClick}
      aria-label={`Add ${label}`}
    >
      <span className="mrg-bank-visual"><BlockVisual type={type} /></span>
      <strong>{label}</strong>
    </button>
  );
}

function MathPanel({ phase, level, topBoxes, displayH1, displayT1, displayO1, displayH2, displayT2, displayO2, inputs, focusedCell, onFocus, onSubmit, onKeypadPress }) {
  const answerCells = [
    { id: "a_H", value: inputs.a_H, label: "Hundreds answer", tone: "hundreds", disabled: level === "100" },
    { id: "a_T", value: inputs.a_T, label: "Tens answer", tone: "tens", disabled: false },
    { id: "a_O", value: inputs.a_O, label: "Ones answer", tone: "ones", disabled: false }
  ];

  return (
    <aside className={`mrg-math-panel ${phase === "build" ? "is-locked" : ""}`}>
      <div className="mrg-panel-title">Math Panel</div>
      <div className="mrg-panel-scroll">
        <div className="mrg-equation-card">
          <div className="mrg-panel-equation-grid" aria-label="Place value equation">
            <span />
            <span className="mrg-top-box mrg-tone-h">{topBoxes.H}</span>
            <span className="mrg-top-box mrg-tone-t">{topBoxes.T}</span>
            <span className="mrg-top-box mrg-tone-o">{topBoxes.O}</span>

            <span />
            <strong className="mrg-math-digit mrg-tone-h-text">{displayH1}</strong>
            <strong className="mrg-math-digit mrg-tone-t-text">{displayT1}</strong>
            <strong className="mrg-math-digit mrg-tone-o-text">{displayO1}</strong>

            <span className="mrg-minus-symbol"><Minus size={25} strokeWidth={4} /></span>
            <strong className="mrg-math-digit mrg-tone-h-text">{displayH2}</strong>
            <strong className="mrg-math-digit mrg-tone-t-text">{displayT2}</strong>
            <strong className="mrg-math-digit mrg-tone-o-text">{displayO2}</strong>

            <span className="mrg-answer-line" />
            <span className="mrg-answer-line" />
            <span className="mrg-answer-line" />
            <span className="mrg-answer-line" />

            <span />
            {answerCells.map((cell) => (
              <button
                className={`mrg-answer-cell mrg-tone-${cell.tone} ${focusedCell === cell.id ? "is-focused" : ""}`}
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

          <button className="mrg-submit-button" type="button" onClick={onSubmit} disabled={phase !== "solve"}>
            Submit <Check size={19} strokeWidth={3} />
          </button>
        </div>

        {focusedCell && phase === "solve" && (
          <div className="mrg-keypad" role="dialog" aria-label="Select number">
            <div className="mrg-keypad-heading">
              <span>Select Number</span>
              <button type="button" onClick={() => onFocus(null)} aria-label="Close number picker"><X size={18} /></button>
            </div>
            <div className="mrg-keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <button type="button" key={number} onClick={() => onKeypadPress(String(number))}>{number}</button>
              ))}
              <button className="is-delete" type="button" onClick={() => onKeypadPress("DEL")}>DEL</button>
              <button type="button" onClick={() => onKeypadPress("0")}>0</button>
              <span aria-hidden="true" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function MinusRegroupGame() {
  const [level, setLevel] = useState("1000");
  const [groupingMode, setGroupingMode] = useState("mixed");
  const [problem, setProblem] = useState(DEFAULT_PROBLEM);
  const [phase, setPhase] = useState("build");
  const [blocks, setBlocks] = useState([]);
  const [regroupValues, setRegroupValues] = useState({ H: 0, T: 0 });
  const [history, setHistory] = useState([]);
  const [showBuildClue, setShowBuildClue] = useState(false);
  const [showSolveClue, setShowSolveClue] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [inputs, setInputs] = useState({ a_H: "", a_T: "", a_O: "" });
  const [focusedCell, setFocusedCell] = useState(null);
  const [musicMode, setMusicMode] = useState("off");
  const audioContextRef = useRef(null);
  const errorTimerRef = useRef(null);

  const expected = useMemo(() => expectedAnswers(problem), [problem]);

  useEffect(() => () => window.clearTimeout(errorTimerRef.current), []);

  useEffect(() => {
    if (musicMode === "off") return undefined;
    const context = getAudioContext();
    if (!context) return undefined;
    const notes = musicMode === "peaceful" ? [392, 440, 523.25, 587.33, 659.25] : [261.63, 329.63, 392, 523.25];
    let noteIndex = 0;
    const intervalId = window.setInterval(() => {
      tone(context, notes[noteIndex % notes.length], musicMode === "peaceful" ? 1.8 : .24, musicMode === "peaceful" ? "sine" : "square", musicMode === "peaceful" ? .05 : .04);
      noteIndex += 1;
    }, musicMode === "peaceful" ? 650 : 260);
    return () => window.clearInterval(intervalId);
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
    if (type === "drop") tone(context, 400, .1, "sine", .12);
    if (type === "trash") tone(context, 150, .2, "triangle", .12);
    if (type === "shatter") {
      tone(context, 200, .1, "square", .1);
      window.setTimeout(() => tone(context, 800, .1, "square", .08), 55);
    }
    if (type === "error") tone(context, 110, .2, "sawtooth", .1);
    if (type === "success") [440, 554.37, 659.25, 880].forEach((frequency, index) => window.setTimeout(() => tone(context, frequency, .35, "triangle", .12), index * 120));
  }

  function toggleMusic() {
    getAudioContext();
    setMusicMode((current) => current === "off" ? "peaceful" : current === "peaceful" ? "exciting" : "off");
  }

  function startProblem(nextLevel = level, nextGroupingMode = groupingMode) {
    setProblem(generateProblem(nextLevel, nextGroupingMode, problem.n1));
    setPhase("build");
    setBlocks([]);
    setRegroupValues({ H: 0, T: 0 });
    setHistory([]);
    setInputs({ a_H: "", a_T: "", a_O: "" });
    setFocusedCell(null);
    setShowBuildClue(false);
    setShowSolveClue(false);
    setShowReminder(false);
    setErrorMsg("");
  }

  function saveState() {
    setHistory((current) => [...current, { blocks: [...blocks], regroupValues: { ...regroupValues } }]);
  }

  function handleUndo() {
    const lastState = history[history.length - 1];
    if (!lastState) return;
    setBlocks(lastState.blocks);
    setRegroupValues(lastState.regroupValues || { H: 0, T: 0 });
    setHistory((current) => current.slice(0, -1));
  }

  function triggerError(message = "Solve right to left. Ones first.") {
    setErrorMsg(message);
    setFocusedCell(null);
    playSound("error");
    window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => setErrorMsg(""), 2500);
  }

  function handleDragStart(event, blockOrType, source) {
    event.dataTransfer.setData("text/plain", JSON.stringify({ item: blockOrType, source }));
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event, targetRow, targetCol) {
    event.preventDefault();
    const dataString = event.dataTransfer.getData("text/plain");
    if (!dataString) return;

    let data;
    try {
      data = JSON.parse(dataString);
    } catch {
      return;
    }

    const { item, source } = data;
    if (phase === "build" && targetRow !== "build") return;
    if (phase === "solve" && targetRow === "build") return;

    if (source === "bank") {
      if (phase !== "build" || targetRow !== "build" || item !== targetCol) return;
      addBankBlock(item, targetCol);
      return;
    }

    const block = item;
    if (!block || block.row === targetRow && block.col === targetCol) return;
    if (phase === "solve" && targetRow === "trash" && isTrashingOutOfOrder(block.type)) {
      triggerError();
      return;
    }
    if (phase === "solve" && targetRow === "borrow") {
      if (block.type === "H" && targetCol === "T") {
        shatterBlock(block, "H", "T", "T");
        return;
      }
      if (block.type === "T" && targetCol === "O") {
        shatterBlock(block, "T", "O", "O");
        return;
      }
    }

    saveState();
    setBlocks((current) => current.map((entry) => entry.id === block.id ? { ...entry, row: targetRow, col: targetCol } : entry));
    playSound(targetRow === "trash" ? "trash" : "drop");
  }

  function shatterBlock(block, sourceType, sourceCol, outputType) {
    saveState();
    setRegroupValues((current) => ({ ...current, [sourceType]: current[sourceType] + 1 }));
    setBlocks((current) => {
      const rest = current.filter((entry) => entry.id !== block.id);
      const newBlocks = Array.from({ length: 10 }, () => makeBlock(outputType, "borrow", sourceCol));
      return [...rest, ...newBlocks];
    });
    playSound("shatter");
  }

  function handleBorrowClick(targetCol) {
    if (phase !== "solve") return;

    const sourceBlock = targetCol === "T"
      ? blocks.find((block) => block.row === "build" && block.col === "H")
      : blocks.find((block) => block.row === "borrow" && block.col === "T")
        || blocks.find((block) => block.row === "build" && block.col === "T");

    if (!sourceBlock) return;
    shatterBlock(sourceBlock, sourceBlock.type, targetCol, targetCol === "T" ? "T" : "O");
  }

  function addBankBlock(type, targetCol = type) {
    if (phase !== "build") return;
    if (blocks.filter((block) => block.row === "build" && block.col === targetCol).length >= 9) return;
    saveState();
    setBlocks((current) => [...current, makeBlock(type, "build", targetCol)]);
    playSound("drop");
  }

  function handleBankClick(type) {
    addBankBlock(type, type);
  }

  function handleBlockClick(block) {
    if (phase === "build" && block.row === "build") {
      saveState();
      setBlocks((current) => current.filter((entry) => entry.id !== block.id));
      playSound("trash");
      return;
    }

    if (phase !== "solve") return;
    if (block.row === "build" || block.row === "borrow") {
      if (isTrashingOutOfOrder(block.type)) {
        triggerError();
        return;
      }
      saveState();
      setBlocks((current) => current.map((entry) => entry.id === block.id ? { ...entry, row: "trash", col: "all" } : entry));
      playSound("trash");
    } else if (block.row === "trash") {
      saveState();
      setBlocks((current) => current.map((entry) => entry.id === block.id ? { ...entry, row: "build", col: entry.type } : entry));
      playSound("drop");
    }
  }

  function isTrashingOutOfOrder(blockType) {
    if (blockType === "T" && inputs.a_O !== expected.a_O) return true;
    if (blockType === "H") {
      if (inputs.a_O !== expected.a_O) return true;
      const tensOkay = inputs.a_T === expected.a_T || expected.a_T === "" && inputs.a_T === "0";
      if (!tensOkay) return true;
    }
    return false;
  }

  function handleCellFocus(cellId) {
    if (!cellId) {
      setFocusedCell(null);
      return;
    }
    if (cellId === "a_T" && inputs.a_O !== expected.a_O) {
      triggerError();
      return;
    }
    if (cellId === "a_H" && inputs.a_T !== expected.a_T) {
      if (expected.a_T === "" && inputs.a_T === "0") triggerError("No need to write 0 at the front. Leave it blank.");
      else triggerError();
      return;
    }
    setFocusedCell(cellId);
  }

  function handleKeypadPress(value) {
    getAudioContext();
    if (!focusedCell) return;
    if (value === "DEL") setInputs((current) => ({ ...current, [focusedCell]: "" }));
    else {
      setInputs((current) => ({ ...current, [focusedCell]: value }));
      setFocusedCell(null);
    }
  }

  function handleSubmit() {
    setFocusedCell(null);
    if (inputs.a_O === expected.a_O && inputs.a_T === expected.a_T && inputs.a_H === expected.a_H) {
      playSound("success");
      setPhase("success");
      return;
    }

    const expectedTotal = Number(expected.a_H || 0) * 100 + Number(expected.a_T || 0) * 10 + Number(expected.a_O || 0);
    const userTotal = Number(inputs.a_H || 0) * 100 + Number(inputs.a_T || 0) * 10 + Number(inputs.a_O || 0);
    if (userTotal === expectedTotal) triggerError("Almost. Do not write zeros at the front.");
    else triggerError("Incorrect answer. Check your math.");
  }

  useEffect(() => {
    if (phase !== "build") return undefined;
    const counts = { H: 0, T: 0, O: 0 };
    blocks.forEach((block) => {
      if (block.row === "build") counts[block.type] += 1;
    });
    const total = counts.H * 100 + counts.T * 10 + counts.O;
    if (total !== problem.n1) return undefined;
    const timer = window.setTimeout(() => {
      setPhase("solve");
      setShowReminder(true);
      setHistory([]);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [blocks, phase, problem.n1]);

  const counts = { H: 0, T: 0, O: 0 };
  blocks.forEach((block) => {
    if (block.row === "build") counts[block.type] += 1;
  });

  const displayH1 = phase === "build" ? counts.H || "" : getDigits(problem.n1).H || "";
  const displayT1 = phase === "build" ? counts.T || (counts.H > 0 ? "0" : "") : getDigits(problem.n1).T;
  const displayO1 = phase === "build" ? counts.O : getDigits(problem.n1).O;
  const displayH2 = phase === "build" ? "" : getDigits(problem.n2).H || "";
  const displayT2 = phase === "build" ? "" : getDigits(problem.n2).T;
  const displayO2 = phase === "build" ? "" : getDigits(problem.n2).O;
  const topBoxes = { H: "", T: "", O: "" };
  const isShatteredH = regroupValues.H > 0;
  const isShatteredT = regroupValues.T > 0;
  if (isShatteredH) {
    topBoxes.H = displayH1 - regroupValues.H;
    topBoxes.T = 10;
  }
  if (isShatteredT) {
    topBoxes.T = isShatteredH ? 10 - regroupValues.T : displayT1 - regroupValues.T;
    topBoxes.O = 10;
  }

  function renderBlock(block) {
    return (
      <button
        className="mrg-mat-block"
        type="button"
        key={block.id}
        draggable="true"
        onDragStart={(event) => handleDragStart(event, block, "mat")}
        onClick={(event) => { event.stopPropagation(); handleBlockClick(block); }}
        title={block.row === "trash" ? "Click to undo" : `Click to move ${blockName(block.type)}`}
        aria-label={`${blockName(block.type)} block`}
      >
        <BlockVisual type={block.type} />
      </button>
    );
  }

  function renderMatZone(row, col, title, toneName) {
    const zoneBlocks = blocks.filter((block) => block.row === row && (row === "trash" || block.col === col));
    const isBuildTarget = phase === "build" && row === "build";
    const isTrashTarget = phase === "solve" && row === "trash";
    const isShatterTarget = phase === "solve" && row === "borrow" && (
      col === "T" && blocks.some((block) => block.row === "build" && block.col === "H")
      || col === "O" && blocks.some((block) => (block.row === "borrow" || block.row === "build") && block.col === "T")
    );
    return (
      <div
        className={`mrg-zone mrg-zone-${row} mrg-zone-${toneName} ${isBuildTarget || isTrashTarget || isShatterTarget ? "is-target" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleDrop(event, row, col)}
        onClick={() => isShatterTarget && handleBorrowClick(col)}
        onKeyDown={(event) => {
          if (isShatterTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            handleBorrowClick(col);
          }
        }}
        role={isShatterTarget ? "button" : undefined}
        tabIndex={isShatterTarget ? 0 : -1}
        aria-label={isShatterTarget ? `${title}. Click to shatter a block` : undefined}
      >
        <span className="mrg-zone-label">{row === "trash" ? <><Trash2 size={13} /> {title}</> : title}</span>
        <div className="mrg-zone-blocks">{zoneBlocks.map(renderBlock)}</div>
      </div>
    );
  }

  return (
    <main className="mrg-app">
      <header className="mrg-topbar">
        <a className="mrg-home-link" href="/murid/ruang" aria-label="Back to learning space"><ArrowLeft size={17} /> <span>Learning space</span></a>
        <div className="mrg-equation-pill" aria-label={`${problem.n1} minus ${problem.n2}`}>
          <strong>{problem.n1} - {problem.n2} = </strong><span>{phase === "success" ? problem.n1 - problem.n2 : "?"}</span>
        </div>
        <div className="mrg-controls">
          <label><span className="sr-only">Number range</span><select value={level} onChange={(event) => { setLevel(event.target.value); startProblem(event.target.value, groupingMode); }}><option value="100">Under 100</option><option value="1000">Under 1000</option></select></label>
          <label><span className="sr-only">Regrouping mode</span><select value={groupingMode} onChange={(event) => { setGroupingMode(event.target.value); startProblem(level, event.target.value); }}><option value="no-grouping">No Regroup</option><option value="mixed">Mixed</option><option value="grouping">Force Regroup</option></select></label>
          <button className="mrg-music-button" type="button" onClick={toggleMusic} title="Toggle background music"><Music size={16} /><span>{musicMode === "peaceful" ? "Peaceful" : musicMode === "exciting" ? "Exciting" : "Off"}</span></button>
        </div>
      </header>

      <div className="mrg-game-body">
        <aside className="mrg-bank">
          <div className="mrg-bank-title">Bank</div>
          <div className="mrg-bank-content">
            <div className="mrg-bank-heading"><span>Drag / Click</span><button type="button" onClick={() => setShowBuildClue(true)} aria-label="Open help" title="Help"><CircleHelp size={16} /></button></div>
            {level === "1000" && <BlockCard type="H" label="Hundreds" onClick={() => handleBankClick("H")} onDragStart={handleDragStart} />}
            <BlockCard type="T" label="Tens" onClick={() => handleBankClick("T")} onDragStart={handleDragStart} />
            <BlockCard type="O" label="Ones" onClick={() => handleBankClick("O")} onDragStart={handleDragStart} />
            <button className="mrg-undo-button" type="button" onClick={handleUndo} disabled={history.length === 0}><Undo2 size={18} /> Undo</button>
          </div>
        </aside>

        <section className="mrg-mat-board" aria-label="Place value work area">
          <div className="mrg-place-headings"><span>Hundreds</span><span>Tens</span><span>Ones</span></div>
          <div className="mrg-zone-row mrg-borrow-row">
            {renderMatZone("borrow", "H", "Borrow Space", "h")}
            {renderMatZone("borrow", "T", "Shatter Hundreds here", "t")}
            {renderMatZone("borrow", "O", "Shatter Tens here", "o")}
          </div>
          <div className={`mrg-zone-row mrg-build-row ${phase === "solve" ? "is-solving" : ""}`}>
            {renderMatZone("build", "H", "Build Space", "h")}
            {renderMatZone("build", "T", "Build Space", "t")}
            {renderMatZone("build", "O", "Build Space", "o")}
          </div>
          <div className={`mrg-trash-zone ${phase === "build" ? "is-disabled" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "trash", "all")}>
            <span className="mrg-trash-title"><Trash2 size={15} /> Trash Area</span>
            <div className="mrg-trash-blocks">{blocks.filter((block) => block.row === "trash").map(renderBlock)}</div>
          </div>
        </section>

        <MathPanel
          phase={phase}
          level={level}
          topBoxes={topBoxes}
          displayH1={displayH1}
          displayT1={displayT1}
          displayO1={displayO1}
          displayH2={displayH2}
          displayT2={displayT2}
          displayO2={displayO2}
          inputs={inputs}
          focusedCell={focusedCell}
          onFocus={handleCellFocus}
          onSubmit={handleSubmit}
          onKeypadPress={handleKeypadPress}
        />
      </div>

      <footer className="mrg-footer"><span><Volume2 size={15} /> Build the top number, then subtract from Ones to Hundreds.</span><a className="mrg-footer-game" href="/mosquito-splat?op=tolak">Permainan Nyamuk</a><a href="/" aria-label="Return to maths selection"><ArrowRight size={15} /> Maths</a></footer>

      {errorMsg && <div className="mrg-error-toast" role="alert"><X size={22} /> <span>{errorMsg}</span></div>}

      {(showBuildClue || showSolveClue || showReminder) && (
        <div className="mrg-overlay">
          <div className="mrg-overlay-card" role="dialog" aria-modal="true" aria-labelledby="mrg-overlay-title">
            <button className="mrg-overlay-close" type="button" onClick={() => { setShowBuildClue(false); setShowSolveClue(false); setShowReminder(false); }} aria-label="Close"><X size={18} /></button>
            <div className="mrg-overlay-mark">{showReminder ? <Check size={28} /> : <CircleHelp size={28} />}</div>
            <h2 id="mrg-overlay-title">{showBuildClue ? `Build ${problem.n1}` : showReminder ? "Number built" : "Start subtracting"}</h2>
            <p>{showBuildClue ? "Drag or click blocks from Bank into the matching Build Space." : showReminder ? `Now subtract ${problem.n2}. Work from Ones to Hundreds.` : "Move blocks to the red Trash Area. If you need more, shatter a Ten or Hundred in the Borrow Space."}</p>
            <button className="mrg-overlay-action" type="button" onClick={() => { if (showReminder) setShowReminder(false); else { setShowBuildClue(false); setShowSolveClue(false); } }}>{showReminder ? "Start subtracting" : "Got it"}<ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </main>
  );
}

export default MinusRegroupGame;
