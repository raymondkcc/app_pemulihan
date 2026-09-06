import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Eraser, Play, RotateCcw, Star, Volume2, VolumeX } from "lucide-react";
import { getLetterStrokes } from "./letterStrokes.js";
import { gradeLetter, gradeStroke } from "./grading.js";

const sounds = {
  stroke: [[660, 0.08], [880, 0.12]],
  success: [[523, 0.1], [659, 0.1], [784, 0.2]],
  retry: [[330, 0.14], [260, 0.2]],
  celebrate: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.3]]
};
let sharedAudioContext = null;

function playSound(name, muted) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (muted || !AudioContextClass) return;
  sharedAudioContext ||= new AudioContextClass();
  const context = sharedAudioContext;
  if (context.state === "suspended") context.resume().catch(() => {});
  let offset = 0;
  sounds[name].forEach(([frequency, duration]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + offset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + duration + 0.02);
    offset += duration;
  });
}

function pointsToString(points) { return points.map((point) => `${point.x},${point.y}`).join(" "); }

export default function HandwritingGame({ selectedLetter, letterCase, onNextLetter }) {
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const drawingRef = useRef(false);
  const currentRef = useRef([]);
  const awardedLettersRef = useRef(new Set());
  const [strokes, setStrokes] = useState(() => getLetterStrokes(selectedLetter.letter, letterCase));
  const [completed, setCompleted] = useState([]);
  const [current, setCurrent] = useState([]);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState("Mula di titik hijau, ikut anak panah.");
  const [muted, setMuted] = useState(false);
  const [finished, setFinished] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [guidePlaying, setGuidePlaying] = useState(false);
  const guideTimerRef = useRef(null);

  useEffect(() => {
    const nextStrokes = getLetterStrokes(selectedLetter.letter, letterCase);
    window.clearTimeout(guideTimerRef.current);
    setGuidePlaying(false); setStrokes(nextStrokes); setCompleted([]); setCurrent([]); setResults([]); setFinished(null); setFeedback("Mula di titik hijau, ikut anak panah.");
  }, [selectedLetter.letter, letterCase]);

  useEffect(() => () => window.clearTimeout(guideTimerRef.current), []);

  function redraw(points = current) {
    const canvas = canvasRef.current, board = boardRef.current;
    if (!canvas || !board) return;
    const rect = board.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
    canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
    const context = canvas.getContext("2d"); context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    const draw = (linePoints, color, width) => { if (linePoints.length < 2) return; context.strokeStyle = color; context.lineWidth = width; context.lineCap = "round"; context.lineJoin = "round"; context.beginPath(); linePoints.forEach((point, index) => { const x = (point.x / 100) * rect.width; const y = (point.y / 100) * rect.height; index ? context.lineTo(x, y) : context.moveTo(x, y); }); context.stroke(); };
    completed.forEach((linePoints) => draw(linePoints, "#f06f61", 10));
    draw(points, "#2166d1", 8);
  }

  useEffect(() => { redraw(); const observer = new ResizeObserver(() => redraw()); observer.observe(boardRef.current); return () => observer.disconnect(); });

  function locate(event) {
    const rect = boardRef.current.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  }
  function begin(event) {
    if (finished || drawingRef.current || completed.length >= strokes.length) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drawingRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); const point = locate(event); currentRef.current = [point]; setCurrent(currentRef.current);
  }
  function move(event) { if (drawingRef.current) { currentRef.current = [...currentRef.current, locate(event)]; setCurrent(currentRef.current); } }
  function end(event) {
    if (!drawingRef.current) return;
    drawingRef.current = false; event.currentTarget.releasePointerCapture?.(event.pointerId);
    const attempt = [...currentRef.current, locate(event)]; const result = gradeStroke(attempt, strokes[completed.length]);
    if (!result.pass) { setFeedback(result.feedback); setStreak(0); currentRef.current = []; setCurrent([]); playSound("retry", muted); return; }
    const nextResults = [...results, result], nextCompleted = [...completed, attempt];
    setResults(nextResults); setCompleted(nextCompleted); currentRef.current = []; setCurrent([]); playSound("stroke", muted);
    if (nextCompleted.length === strokes.length) { const summary = gradeLetter(nextResults); const attemptKey = `${letterCase}:${selectedLetter.letter}`; const isNewLetter = !awardedLettersRef.current.has(attemptKey); if (isNewLetter) { awardedLettersRef.current.add(attemptKey); setTotalPoints((points) => points + summary.score); setStreak((value) => value + 1); } setFinished(summary); setFeedback(isNewLetter ? (summary.stars === 3 ? "Lencana hebat!" : "Huruf siap! Cuba lagi untuk lebih kemas.") : "Huruf ini sudah dapat mata. Hebat berlatih lagi!"); playSound("celebrate", muted); }
    else { setFeedback(`Bagus! Strok ${nextCompleted.length} siap.`); }
  }
  function restart() { setCompleted([]); currentRef.current = []; setCurrent([]); setResults([]); setFinished(null); setFeedback("Mula di titik hijau, ikut anak panah."); }
  function undo() { if (finished) return; setCompleted((items) => items.slice(0, -1)); setResults((items) => items.slice(0, -1)); setFeedback("Strok terakhir dibuang. Cuba semula."); }
  function replayGuide() {
    if (!active || guidePlaying) return;
    window.clearTimeout(guideTimerRef.current);
    setGuidePlaying(true); playSound("stroke", muted); setFeedback("Lihat arah gerakan, kemudian cuba sendiri.");
    guideTimerRef.current = window.setTimeout(() => setGuidePlaying(false), 1500);
  }

  const glyph = letterCase === "capital" ? selectedLetter.letter : selectedLetter.letter.toLowerCase();
  const active = strokes[completed.length];
  return <section className="handwriting-game" aria-labelledby="handwriting-game-title">
    <div className="handwriting-heading"><div><span className="section-kicker">Aktiviti 02 / Tulis</span><h2 id="handwriting-game-title">Laluan huruf</h2><p>Tulis <strong>{glyph}</strong> ikut laluan. Setiap strok dikira.</p></div><div className="handwriting-score-strip"><span><strong>{finished?.score || 0}</strong><small>skor</small></span><span><strong>{totalPoints}</strong><small>mata</small></span><span><strong>{streak}</strong><small>rentak</small></span></div></div>
    <div className="handwriting-layout">
      <div className="handwriting-board-wrap"><div className="handwriting-board" ref={boardRef} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <svg className={`handwriting-guide ${guidePlaying ? "is-playing" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="handwriting-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2166d1" /></marker></defs>{strokes.map((route, index) => <polyline key={index} points={pointsToString(route.points)} className={index < completed.length ? "is-complete" : index === completed.length ? "is-active" : "is-future"} />)}{active && !finished && <><circle cx={active.points[0].x} cy={active.points[0].y} r="5" className="handwriting-start-dot" /><circle cx={active.points.at(-1).x} cy={active.points.at(-1).y} r="3" className="handwriting-end-dot" />{!active.dot && <path d={`M ${active.points[Math.max(1, Math.floor(active.points.length / 2) - 1)].x} ${active.points[Math.max(1, Math.floor(active.points.length / 2) - 1)].y} L ${active.points[Math.floor(active.points.length / 2)].x} ${active.points[Math.floor(active.points.length / 2)].y}`} className="handwriting-arrow" />}</>}</svg><canvas ref={canvasRef} className="handwriting-ink" /></div><div className="handwriting-baseline" aria-hidden="true"><i /><i /><i /></div></div>
      <div className="handwriting-controls"><div className="handwriting-progress" aria-label={`${completed.length} daripada ${strokes.length} strok siap`}>{strokes.map((route, index) => <span key={index} className={index < completed.length ? "is-done" : index === completed.length ? "is-now" : ""}><b>{index + 1}</b><i /></span>)}</div><p className={`handwriting-feedback ${finished ? "is-finished" : ""}`} role="status" aria-live="polite">{finished ? <><Check size={18} /> {feedback} <span className="handwriting-stars">{[1, 2, 3].map((star) => <Star key={star} size={20} fill={star <= finished.stars ? "currentColor" : "none"} />)}</span></> : feedback}</p><div className="handwriting-actions"><button className="primary-mini-action" type="button" onClick={replayGuide} disabled={!active || guidePlaying}><Play size={17} fill="currentColor" /> {guidePlaying ? "Sedang tunjuk..." : "Lihat panduan"}</button><button className="letter-case-small-control" type="button" onClick={undo} disabled={!completed.length || Boolean(finished)} title="Undur strok terakhir"><RotateCcw size={16} /> Undur</button><button className="letter-case-small-control" type="button" onClick={restart} title="Mula semula"><Eraser size={16} /> Mula semula</button><button className="icon-action" type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Buka bunyi" : "Senyapkan bunyi"} title={muted ? "Buka bunyi" : "Senyapkan bunyi"}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button></div>{finished && <button className="handwriting-next" type="button" onClick={onNextLetter}>Huruf seterusnya <ChevronRight size={18} /></button>}</div>
    </div>
  </section>;
}
