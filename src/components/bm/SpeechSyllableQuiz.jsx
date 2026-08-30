import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mic, RefreshCcw, Volume2, XCircle } from "lucide-react";
import { createKvRows, loadKvkPack } from "../../data/syllablePack.js";
import { normalizeSyllableTranscript, getSpeechRecognitionConstructor, requestMicrophonePermission } from "../../utils/speechRecognition.js";
import { playSyllableAudio, stopSyllableAudio } from "../../utils/syllableAudio.js";

const MODES = { kv: "KV", kvk: "KVK" };
const KV_QUESTIONS = createKvRows("e-pepet").flat().filter((item) => item.syllable.length === 2 && !["we", "ye"].includes(item.syllable));

function nextRandom(items, previous) {
  if (!items.length) return null;
  const choices = items.filter((item) => item.syllable !== previous);
  return choices[Math.floor(Math.random() * (choices.length || items.length))] || items[0];
}

function questionAnswer(item) {
  return normalizeSyllableTranscript(item.syllable);
}

export default function SpeechSyllableQuiz({ onBack }) {
  const [mode, setMode] = useState("kv");
  const [kvkItems, setKvkItems] = useState([]);
  const [question, setQuestion] = useState(KV_QUESTIONS[0]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState({ correct: 0, retry: 0 });
  const [status, setStatus] = useState({ type: "idle", text: "Tekan dan tahan butang untuk menyebut." });
  const recognitionRef = useRef(null);
  const pressedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadKvkPack().then((items) => mountedRef.current && setKvkItems(items.filter((item) => item.sound === "e-pepet" || item.sound === "standard"))).catch(() => {});
    return () => {
      mountedRef.current = false;
      pressedRef.current = false;
      recognitionRef.current?.abort();
      stopSyllableAudio();
    };
  }, []);

  const questions = useMemo(() => mode === "kv" ? KV_QUESTIONS : kvkItems, [kvkItems, mode]);

  useEffect(() => {
    recognitionRef.current?.abort();
    pressedRef.current = false;
    setStatus({ type: "idle", text: "Tekan dan tahan butang untuk menyebut." });
    setQuestion((current) => nextRandom(questions, current?.syllable));
  }, [mode, questions]);

  function selectMode(nextMode) {
    if (nextMode === mode) return;
    stopSyllableAudio();
    setMode(nextMode);
    setQuestionNumber(1);
    setScore({ correct: 0, retry: 0 });
  }

  function nextQuestion() {
    recognitionRef.current?.abort();
    pressedRef.current = false;
    setQuestion((current) => nextRandom(questions, current?.syllable));
    setQuestionNumber((number) => number + 1);
    setStatus({ type: "idle", text: "Tekan dan tahan butang untuk menyebut." });
  }

  function listenExample() {
    if (!question || status.type === "listening" || status.type === "requesting") return;
    playSyllableAudio(question);
  }

  async function startListening() {
    if (pressedRef.current || status.type === "requesting" || status.type === "listening") return;
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setStatus({ type: "unsupported", text: "Pengecaman suara tidak disokong oleh pelayar ini." });
      return;
    }
    pressedRef.current = true;
    setStatus({ type: "requesting", text: "Minta izin mikrofon..." });
    try {
      await requestMicrophonePermission();
    } catch {
      pressedRef.current = false;
      setStatus({ type: "denied", text: "Izin mikrofon belum diberi. Benarkan mikrofon dan cuba lagi." });
      return;
    }
    if (!pressedRef.current) {
      if (mountedRef.current) setStatus({ type: "idle", text: "Tekan dan tahan butang untuk menyebut." });
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "ms-MY";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => mountedRef.current && setStatus({ type: "listening", text: `Sebut ${question?.syllable || "suku kata"}...` });
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      const normalized = normalizeSyllableTranscript(transcript);
      const correct = normalized === questionAnswer(question);
      setScore((current) => ({ ...current, [correct ? "correct" : "retry"]: current[correct ? "correct" : "retry"] + 1 }));
      setStatus(correct ? { type: "correct", text: `Betul! Saya dengar “${transcript}”.` } : { type: "incorrect", text: `Saya dengar “${transcript}”. Cuba sebut ${question.syllable}.` });
    };
    recognition.onerror = (event) => {
      if (!mountedRef.current) return;
      const text = event.error === "no-speech" ? "Tiada suara dikesan. Cuba tekan dan tahan lagi." : "Bacaan suara belum dapat didengar. Cuba lagi.";
      setStatus({ type: "error", text });
    };
    recognition.onend = () => {
      pressedRef.current = false;
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      pressedRef.current = false;
      recognitionRef.current = null;
      setStatus({ type: "error", text: "Bacaan suara belum dapat dimulakan." });
    }
  }

  function stopListening() {
    if (!pressedRef.current) return;
    recognitionRef.current?.stop();
    pressedRef.current = false;
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startListening();
  }

  function handlePointerUp(event) {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    stopListening();
  }

  function handleKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    startListening();
  }

  function handleKeyUp(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    stopListening();
  }

  const loadingKvk = mode === "kvk" && !kvkItems.length;
  return (
    <div className="home-content hub-content speech-quiz-content">
      <div className="hub-hero sound-hero"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Suku Kata</span></button><div className="hub-title-block"><span className="hub-eyebrow"><Mic size={15} /> Ujian / Sebutan</span><h1>Dengar dan sebut</h1><p>Sebut suku kata yang dipaparkan. Lepaskan butang apabila selesai.</p></div><div className="sound-hero-badge"><CheckCircle2 size={18} /><span><strong>{score.correct}</strong> betul</span></div></div>
      <section className="letter-test-section speech-quiz-section" aria-labelledby="speech-quiz-title">
        <div className="section-heading-row"><div><span className="section-kicker">Ujian 01 / Suku kata</span><h2 id="speech-quiz-title">Uji sebutan</h2><p>Markah hanya betul apabila perkataan yang didengar sama tepat dengan sasaran.</p></div><span className="skill-count"><Volume2 size={15} /> Soalan {questionNumber}</span></div>
        <div className="speech-mode-toggle" role="tablist" aria-label="Pilih mod ujian"><span>Mod</span>{Object.entries(MODES).map(([id, label]) => <button key={id} className={mode === id ? "is-selected" : ""} type="button" role="tab" aria-selected={mode === id} onClick={() => selectMode(id)}>{label}</button>)}</div>
        <div className="speech-quiz-card">
          {loadingKvk ? <p className="kvk-load-status" role="status"><LoaderCircle size={16} /> Memuatkan soalan KVK...</p> : question ? <><span className="speech-quiz-label">Sebut ini</span><div className="speech-target-syllable" aria-live="polite">{question.syllable}</div><button className="speech-example-button" type="button" onClick={listenExample} disabled={status.type === "listening" || status.type === "requesting"}><Volume2 size={17} /> Dengar contoh</button><button className={`push-to-talk ${status.type === "listening" ? "is-listening" : ""}`} type="button" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={stopListening} onLostPointerCapture={stopListening} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onBlur={stopListening} aria-pressed={status.type === "listening"} aria-label="Tekan dan tahan untuk bercakap"><Mic size={25} /><span>{status.type === "listening" ? "Lepaskan untuk semak" : status.type === "requesting" ? "Minta izin..." : "Tekan dan tahan"}</span></button><p className={`speech-feedback ${status.type}`} role="status">{status.type === "correct" && <CheckCircle2 size={17} />}{status.type === "incorrect" && <XCircle size={17} />}{status.type === "error" && <XCircle size={17} />}{status.text}</p><div className="speech-quiz-actions"><button className="secondary-action" type="button" onClick={nextQuestion}><RefreshCcw size={16} /> Soalan baharu</button><span className="speech-score">Betul <strong>{score.correct}</strong> · Cuba lagi <strong>{score.retry}</strong></span></div></> : <p className="kvk-empty-state">Soalan belum sedia.</p>}
        </div>
      </section>
    </div>
  );
}
