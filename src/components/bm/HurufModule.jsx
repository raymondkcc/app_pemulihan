import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Mic, PenLine, RefreshCcw, Volume2 } from "lucide-react";
import { HURUF } from "../../data/bm.js";
import { getSpeechRecognitionConstructor, normalizeSyllableTranscript, requestMicrophonePermission } from "../../utils/speechRecognition.js";

const LetterCaseGame = lazy(() => import("../../games/letterCase/LetterCaseGame.jsx"));
const letterAudioCache = new Map();
let activeLetterAudio = null;

function playLetterAudio(letter) {
  if (!window.Audio) return;
  const source = `/audio/letters/${letter.letter.toLowerCase()}.mp3`;
  const audio = letterAudioCache.get(source) || new window.Audio(source);
  letterAudioCache.set(source, audio);
  if (activeLetterAudio && activeLetterAudio !== audio) {
    activeLetterAudio.pause();
    activeLetterAudio.currentTime = 0;
  }
  activeLetterAudio = audio;
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {
    if (activeLetterAudio === audio) activeLetterAudio = null;
  });
}

function LetterRecognitionPanel({ selectedLetter, onSelect, letterCase }) {
  const [speakingLetter, setSpeakingLetter] = useState("");
  const timerRef = useRef(null);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function chooseLetter(item) {
    if (speakingLetter) return;
    onSelect(item);
    setSpeakingLetter(item.letter);
    playLetterAudio(item);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setSpeakingLetter(""), 900);
  }

  const selectedGlyph = letterCase === "capital" ? selectedLetter.letter : selectedLetter.letter.toLowerCase();
  return (
    <div className="letter-panel letter-recognition-panel">
      <div className="letter-panel-heading"><span className="section-kicker">Aktiviti 01 / Kenal</span><h3>Kenal huruf</h3><p>Tekan satu huruf untuk dengar bunyinya.</p></div>
      <div className="letter-choice-row" aria-label="Pilih huruf untuk belajar">
        {HURUF.map((item, index) => {
          const glyph = letterCase === "capital" ? item.letter : item.letter.toLowerCase();
          const selected = selectedLetter.letter === item.letter;
          return <button className={`letter-choice ${selected ? "is-selected" : ""} ${speakingLetter === item.letter ? "is-speaking" : ""}`} style={{ "--letter-index": index }} type="button" key={item.letter} onClick={() => chooseLetter(item)} disabled={Boolean(speakingLetter)} aria-pressed={selected} aria-label={`Dengar bunyi huruf ${glyph}`} title={`Dengar ${glyph}`}><strong>{glyph}</strong><span className="letter-button-ripple" aria-hidden="true"><i /><i /><i /></span></button>;
        })}
      </div>
      <div className="letter-selected-card" role="status" aria-live="polite"><span>Huruf dipilih</span><strong>{selectedGlyph}</strong><em>{speakingLetter ? "Sedang bunyi..." : "Tekan huruf untuk dengar"}</em></div>
    </div>
  );
}

function LetterMatchTest() {
  const [target, setTarget] = useState(HURUF[0]);
  const [feedback, setFeedback] = useState(null);
  function chooseAnswer(answer) {
    setFeedback(answer.letter === target.letter ? { type: "correct", text: `Betul! ${target.letter} jadi ${target.letter.toLowerCase()}.` } : { type: "retry", text: `Cuba lagi. Cari pasangan kecil untuk ${target.letter}.` });
  }
  function nextQuestion() {
    const nextIndex = (HURUF.findIndex((item) => item.letter === target.letter) + 1) % HURUF.length;
    setTarget(HURUF[nextIndex]);
    setFeedback(null);
  }
  return <div className="letter-test-card match-test-card"><div className="letter-test-heading"><span className="test-number">01</span><div><span className="section-kicker">Uji diri</span><h3>Padan besar dengan kecil</h3></div></div><p className="letter-test-prompt">Cari pasangan untuk</p><div className="match-target-letter">{target.letter}</div><div className="lowercase-choice-row" aria-label={`Pilih huruf kecil untuk ${target.letter}`}>{HURUF.map((item) => <button className="lowercase-choice" type="button" key={item.letter} onClick={() => chooseAnswer(item)}>{item.letter.toLowerCase()}</button>)}</div>{feedback && <p className={`letter-feedback ${feedback.type}`} role="status">{feedback.text}</p>}<button className="secondary-action" type="button" onClick={nextQuestion} disabled={feedback?.type !== "correct"}><RefreshCcw size={16} /> Soalan seterusnya</button></div>;
}

function LetterSoundTest({ letter, letterCase }) {
  const [status, setStatus] = useState({ type: "idle", text: "Tekan dan tahan untuk membaca." });
  const recognitionRef = useRef(null);
  const pressedRef = useRef(false);
  const glyph = letterCase === "capital" ? letter.letter : letter.letter.toLowerCase();
  useEffect(() => () => recognitionRef.current?.abort(), []);

  async function startListening() {
    if (pressedRef.current) return;
    pressedRef.current = true;
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) { pressedRef.current = false; setStatus({ type: "error", text: "Pengecaman suara tidak disokong oleh pelayar ini." }); return; }
    setStatus({ type: "requesting", text: "Minta izin mikrofon..." });
    try { await requestMicrophonePermission(); } catch { pressedRef.current = false; setStatus({ type: "error", text: "Izin mikrofon belum diberi. Cuba benarkan mikrofon." }); return; }
    const recognition = new Recognition();
    recognition.lang = "ms-MY";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setStatus({ type: "listening", text: `Sebut bunyi ${letter.sound}...` });
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      const normalized = normalizeSyllableTranscript(transcript);
      const correct = letter.accepted.some((answer) => normalizeSyllableTranscript(answer) === normalized);
      setStatus(correct ? { type: "correct", text: `Betul! Saya dengar "${transcript}".` } : { type: "retry", text: `Saya dengar "${transcript}". Cuba sebut ${letter.sound}.` });
    };
    recognition.onerror = () => setStatus({ type: "error", text: "Bacaan suara belum dapat didengar. Cuba lagi." });
    recognition.onend = () => { pressedRef.current = false; recognitionRef.current = null; };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { pressedRef.current = false; setStatus({ type: "error", text: "Bacaan suara belum dapat dimulakan." }); }
  }
  function stopListening() {
    if (!pressedRef.current) return;
    recognitionRef.current?.stop();
    pressedRef.current = false;
  }
  return <div className="letter-test-card sound-test-card"><div className="letter-test-heading"><span className="test-number">02</span><div><span className="section-kicker">Uji diri</span><h3>Dengar dan baca</h3></div></div><p className="letter-test-prompt">Baca huruf ini dengan kuat</p><div className="sound-target"><strong>{glyph}</strong></div><button className={`mic-action ${status.type === "listening" ? "is-listening" : ""}`} type="button" onPointerDown={startListening} onPointerUp={stopListening} onPointerCancel={stopListening} onPointerLeave={stopListening} disabled={status.type === "requesting"}><Mic size={18} /> {status.type === "listening" ? "Lepaskan untuk semak" : "Tekan dan tahan"}</button><p className={`letter-feedback ${status.type}`} role="status">{status.text}</p></div>;
}

export default function HurufModule({ onBack }) {
  const [selectedLetter, setSelectedLetter] = useState(HURUF[0]);
  const [letterCase, setLetterCase] = useState("capital");
  return <div className="home-content hub-content letter-learning-content"><div className="hub-hero letter-hero"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Bahasa Melayu</span></button><div className="hub-title-block"><span className="hub-eyebrow"><PenLine size={15} /> Huruf</span><h1>Kenal dan bunyi!</h1><p>Pilih huruf besar atau huruf kecil, kemudian tekan untuk dengar.</p></div><div className="letter-hero-badge"><span>A</span><strong>26 huruf</strong></div></div><section className="letter-learning-section" aria-labelledby="letter-learning-title"><div className="section-heading-row"><div><span className="section-kicker">Aktiviti belajar</span><h2 id="letter-learning-title">Huruf hari ini</h2><p>Pilih huruf besar atau huruf kecil.</p></div><span className="skill-count"><Volume2 size={15} /> Bunyi Melayu</span></div><div className="case-toggle" role="tablist" aria-label="Tukar huruf besar atau kecil"><button className={letterCase === "capital" ? "is-selected" : ""} type="button" role="tab" aria-selected={letterCase === "capital"} onClick={() => setLetterCase("capital")}><strong>A</strong><span>Huruf besar</span></button><button className={letterCase === "small" ? "is-selected" : ""} type="button" role="tab" aria-selected={letterCase === "small"} onClick={() => setLetterCase("small")}><strong>a</strong><span>Huruf kecil</span></button></div><div className="letter-learning-grid letter-learning-grid-single"><LetterRecognitionPanel selectedLetter={selectedLetter} onSelect={setSelectedLetter} letterCase={letterCase} /></div></section><Suspense fallback={<div className="letter-case-game-loading" role="status">Menyediakan permainan huruf...</div>}><LetterCaseGame letters={HURUF} onPlayLetter={playLetterAudio} /></Suspense><section className="letter-test-section" aria-labelledby="letter-test-title"><div className="section-heading-row"><div><span className="section-kicker">Uji diri</span><h2 id="letter-test-title">Cuba sendiri</h2><p>Dua aktiviti ringkas untuk menunjukkan apa yang anda tahu.</p></div><span className="skill-count"><CheckCircle2 size={15} /> 2 aktiviti</span></div><div className="letter-test-grid"><LetterMatchTest /><LetterSoundTest letter={selectedLetter} letterCase={letterCase} /></div></section></div>;
}
