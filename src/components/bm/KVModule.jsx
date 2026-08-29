function KVModule({ onBack }) {
  const [eSound, setESound] = useState("e-pepet");
  const [selectedItem, setSelectedItem] = useState(() => createKvItem("b", "a", "e-pepet"));

  function changeESound(nextSound) {
    setESound(nextSound);
    setSelectedItem((current) => {
      if (nextSound === "e-pepet" && (current.syllable === "we" || current.syllable === "ye")) {
        return createKvItem("b", "a", nextSound);
      }
      return current.syllable.endsWith("e")
        ? createKvItem(current.syllable[0], "e", nextSound)
        : current;
    });
  }

  return (
    <div className="home-content hub-content sound-module-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke ruang Bahasa Melayu">
          <ArrowLeft size={18} /> <span>Ruang</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><BookOpen size={15} /> KV <span>/ Suku kata</span></span>
          <h1>Buka bunyi KV</h1>
          <p>Tekan mana-mana petak untuk dengar bunyi vokal atau suku kata.</p>
        </div>
        <div className="sound-hero-badge"><BookOpen size={18} /><span><strong>{PACK_ONSETS.length * PACK_VOWELS.length}</strong> bunyi sedia</span></div>
      </div>

      <section className="letter-learning-section kv-learning-section" aria-labelledby="kv-learning-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="kv-learning-title">Vokal dan suku kata</h2><p>Pilih mana-mana petak untuk dengar bunyi KV.</p></div>
          <span className="skill-count"><Volume2 size={15} /> Tekan untuk dengar</span>
        </div>
        <div className="e-sound-picker" role="radiogroup" aria-label="Pilih jenis bunyi e">
          <span className="e-sound-picker-label">Pilih bunyi e</span>
          {E_SOUND_OPTIONS.map((option) => (
            <button className={`e-sound-option ${eSound === option.id ? "is-selected" : ""}`} type="button" role="radio" aria-checked={eSound === option.id} key={option.id} onClick={() => changeESound(option.id)}>
              <strong>{option.label}</strong><span>{option.hint}</span>
            </button>
          ))}
        </div>
        <KVSoundTable selectedItem={selectedItem} onSelect={setSelectedItem} eSound={eSound} />
      </section>
      <section className="kv-pond-launch" aria-label="Permainan Lompat Si Katak Lompat">
        <div>
          <span className="section-kicker">Permainan bunyi</span>
          <strong>Lompat Si Katak Lompat</strong>
          <p>Dengar bunyi KV, kemudian pilih gema yang sama.</p>
        </div>
        <a href="/kv-sound-pond">Main sekarang <ArrowRight size={17} /></a>
      </section>
    </div>
  );
}

function LetterSoundTest({ letter, letterCase }) {
  const [status, setStatus] = useState({ type: "idle", text: "Tekan mula untuk gunakan mikrofon." });
  const recognitionRef = useRef(null);
  const glyph = letterCase === "capital" ? letter.letter : letter.letter.toLowerCase();

  useEffect(() => () => recognitionRef.current?.abort(), []);

  async function startListening() {
    if (recognitionRef.current) recognitionRef.current.abort();
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus({ type: "error", text: "Mikrofon tidak tersedia pada pelayar ini." });
      return;
    }

    setStatus({ type: "requesting", text: "Minta izin mikrofon..." });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setStatus({ type: "error", text: "Izin mikrofon belum diberi. Cuba benarkan mikrofon dan ulang lagi." });
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus({ type: "error", text: "Auto marking suara belum disokong oleh pelayar ini." });
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "ms-MY";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setStatus({ type: "listening", text: `Sebut bunyi ${letter.sound}...` });
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const normalized = transcript.replace(/[^a-z]/g, "");
      const correct = letter.accepted.some((word) => normalized.includes(word.replace(/[^a-z]/g, "")));
      setStatus(correct
        ? { type: "correct", text: `Betul! Saya dengar "${transcript}".` }
        : { type: "retry", text: `Saya dengar "${transcript}". Cuba sebut ${letter.sound}.` });
    };
    recognition.onerror = () => setStatus({ type: "error", text: "Bacaan suara belum dapat didengar. Cuba sekali lagi." });
    recognitionRef.current = recognition;
    setStatus({ type: "listening", text: `Sebut bunyi ${letter.sound}...` });
    try {
      recognition.start();
    } catch {
      setStatus({ type: "error", text: "Bacaan suara belum dapat dimulakan." });
    }
  }

  return (
    <div className="letter-test-card sound-test-card">
      <div className="letter-test-heading"><span className="test-number">02</span><div><span className="section-kicker">Uji diri</span><h3>Dengar dan baca</h3></div></div>
      <p className="letter-test-prompt">Baca huruf ini dengan kuat</p>
      <div className="sound-target"><strong>{glyph}</strong></div>
      <button className="mic-action" type="button" onClick={startListening} disabled={status.type === "requesting" || status.type === "listening"}><Mic size={18} /> {status.type === "listening" ? "Sedang dengar..." : "Mula baca"}</button>
      <p className={`letter-feedback ${status.type}`} role="status">{status.text}</p>
    </div>
  );
}

