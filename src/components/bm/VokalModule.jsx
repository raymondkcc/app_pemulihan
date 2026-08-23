function VokalModule({ onBack }) {
  const [selectedVowel, setSelectedVowel] = useState(VOKAL[0]);

  return (
    <div className="home-content hub-content sound-module-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih ruang Bahasa Melayu">
          <ArrowLeft size={18} /> <span>Bahasa Melayu</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Volume2 size={15} /> Vokal <span>/ Vowels</span></span>
          <h1>Dengar bunyi vokal</h1>
          <p>Tekan a, e pepet, e taling, i, o atau u untuk dengar bunyi Bahasa Melayu.</p>
        </div>
        <div className="sound-hero-badge"><Volume2 size={18} /><span><strong>6</strong> bunyi sedia</span></div>
      </div>

      <section className="letter-learning-section" aria-labelledby="vowel-learning-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="vowel-learning-title">Vokal Bahasa Melayu</h2><p>Pilih satu vokal dan dengar bunyinya.</p></div>
          <span className="skill-count"><Volume2 size={15} /> Bunyi Melayu</span>
        </div>
        <div className="letter-learning-grid letter-learning-grid-single">
          <MalaySoundPanel items={VOKAL} selectedItem={selectedVowel} onSelect={setSelectedVowel} title="Kenal bunyi vokal" description="Tekan satu vokal untuk dengar bunyinya." />
        </div>
      </section>

      <ScreamAnimalCard />
    </div>
  );
}

function KVSoundTable({ selectedItem, onSelect, eSound }) {
  const [speakingItem, setSpeakingItem] = useState(null);
  const soundTimer = useRef(null);
  const kvRows = createKvRows(eSound);
  const vowelItems = getKvVowelItems(eSound);

  useEffect(() => {
    const removeVoiceListener = warmSpeechEngine();
    return () => {
      removeVoiceListener();
      window.clearTimeout(soundTimer.current);
    };
  }, []);

  function chooseItem(item) {
    onSelect(item);
    setSpeakingItem(item.id);
    window.clearTimeout(soundTimer.current);
    soundTimer.current = window.setTimeout(() => setSpeakingItem(null), 1000);
    if (item.audioPath) playSyllableAudio(item);
    else speakMalayText(item.sound);
  }

  return (
    <div className="kv-table-wrap">
      <div className="kv-table" role="table" aria-label="Jadual bunyi vokal dan suku kata KV">
        <div className="kv-table-corner" role="columnheader">Bunyi</div>
        {PACK_VOWELS.map((vowel) => <div className="kv-table-vowel" role="columnheader" key={`head-${vowel}`}>{vowel}</div>)}
        <div className="kv-table-label" role="rowheader">Vokal</div>
        {vowelItems.map((item, index) => <SoundChoice key={`vowel-${item.id}`} item={item} index={index} kind="table-vowel" isSelected={selectedItem.id === item.id} isSpeaking={speakingItem === item.id} onChoose={chooseItem} />)}
        {PACK_ONSETS.map((onset, rowIndex) => (
          <Fragment key={`row-${onset}`}>
            <div className="kv-table-label kv-table-label-kv" role="rowheader">{onset}</div>
            {kvRows[rowIndex].map((item, index) => <SoundChoice key={item.id} item={item} index={index} kind="table-syllable" isSelected={selectedItem.id === item.id} isSpeaking={speakingItem === item.id} onChoose={chooseItem} />)}
          </Fragment>
        ))}
      </div>
      <div className="letter-selected-card sound-selected-card" role="status" aria-live="polite">
        <span>Bunyi dipilih</span>
        <strong>{selectedItem.label}</strong>
        <em>{speakingItem ? "Sedang bunyi..." : "Tekan petak untuk dengar"}</em>
      </div>
    </div>
  );
}

function KVModule({ onBack }) {
  const [eSound, setESound] = useState("e-pepet");
