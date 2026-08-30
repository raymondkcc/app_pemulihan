function PerkataanWordCard({ word, isSpeaking, onSpeak, color = "coral", activeSyllableIndex = -1 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageSrc, setImageSrc] = useState(`/images/perkataan/${word}.png`);

  return (
    <button
      className={`word-card ${isSpeaking ? "is-speaking" : ""}`}
      type="button"
      onClick={onSpeak}
      disabled={isSpeaking}
      aria-label={`Dengar perkataan ${word}`}
      title={`Dengar ${word}`}
    >
      <span className="word-card-picture" aria-hidden="true">
        {!imageFailed && (
          <img
            src={imageSrc}
            alt=""
            onError={() => {
              if (imageSrc.endsWith(".png")) setImageSrc(`/images/perkataan/${word}.svg`);
              else setImageFailed(true);
            }}
          />
        )}
        {imageFailed && <Image size={40} />}
      </span>
      <SyllableWord word={word} color={color} activeSyllableIndex={activeSyllableIndex} />
      <span className="word-card-listen" aria-hidden="true"><Volume2 size={14} /></span>
    </button>
  );
}

function SyllableWord({ word, color = "coral", activeSyllableIndex = -1 }) {
  const syllables = splitMalaySyllables(word);
  return (
    <strong className="word-syllable-text">
      {syllables.map((syl, i) => (
        <span key={i} className={`syllable-part syllable-${i % 2 === 0 ? "first" : "second"} syllable-color-${color} ${i === activeSyllableIndex ? "syllable-active" : ""}`} data-index={i}>
          {syl}
        </span>
      ))}
    </strong>
  );
}

function PerkataanSkillSection({ skill }) {
  const [speakingWord, setSpeakingWord] = useState(null);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState(-1);
  const [speechRate, setSpeechRate] = useState(1); // 1 = normal, 0.5 = slow
  const speakingTimer = useRef(null);
  const syllableTimers = useRef([]);

  useEffect(() => () => window.clearTimeout(speakingTimer.current), []);
  useEffect(() => () => syllableTimers.current.forEach(clearTimeout), []);

  function speakWord(word) {
    setSpeakingWord(word);
    setActiveSyllableIndex(-1);

    // Clear previous timers
    window.clearTimeout(speakingTimer.current);
    syllableTimers.current.forEach(clearTimeout);
    syllableTimers.current = [];

    // Speak the word
    speakMalayText(word, speechRate);

    // Animate syllables
    const syllables = splitMalaySyllables(word);
    const baseDuration = speechRate === 1 ? 400 : 700; // ms per syllable

    syllables.forEach((syl, index) => {
      const timer = setTimeout(() => {
        setActiveSyllableIndex(index);
      }, index * baseDuration);
      syllableTimers.current.push(timer);
    });

    // Reset after all syllables
    const totalDuration = syllables.length * baseDuration + 200;
    speakingTimer.current = window.setTimeout(() => {
      setSpeakingWord(null);
      setActiveSyllableIndex(-1);
    }, totalDuration);
  }

  function toggleSpeed() {
    setSpeechRate(prev => prev === 1 ? 0.5 : 1);
  }

  const practiceWords = skill.practice || [];
  const skillWords = skill.words || [];

  return (
    <Fragment>
      {practiceWords.length > 0 && (
        <section className="word-skill-section" aria-labelledby={`${skill.id}-practice-title`}>
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">{skill.code} / Latihan bunyi</span>
              <h2 id={`${skill.id}-practice-title`}>{skill.title || skill.code}</h2>
              <p>Tekan setiap bunyi untuk mendengar sebutan.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="speed-toggle-btn"
                onClick={toggleSpeed}
                title={speechRate === 1 ? "Kelajuan: Normal (klik untuk perlahan)" : "Kelajuan: Perlahan (klik untuk normal)"}
              >
                {speechRate === 1 ? "🐰 Normal" : "🐢 Perlahan"}
              </button>
              <span className="skill-count"><Volume2 size={15} /> {practiceWords.length} bunyi</span>
            </div>
          </div>
          <div className="word-card-grid">
            {practiceWords.map((word) => (
              <PerkataanWordCard
                key={word}
                word={word}
                isSpeaking={speakingWord === word}
                onSpeak={() => speakWord(word)}
                color={skill.color}
                activeSyllableIndex={speakingWord === word ? activeSyllableIndex : -1}
              />
            ))}
          </div>
        </section>
      )}
      {skillWords.length > 0 && (
        <section className="word-skill-section" aria-labelledby={`${skill.id}-word-title`}>
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">{skill.code} / Perkataan</span>
              <h2 id={`${skill.id}-word-title`}>{skill.title || skill.code}</h2>
              <p>Tekan perkataan untuk mendengar dan mengikut sebutan.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="speed-toggle-btn"
                onClick={toggleSpeed}
                title={speechRate === 1 ? "Kelajuan: Normal (klik untuk perlahan)" : "Kelajuan: Perlahan (klik untuk normal)"}
              >
                {speechRate === 1 ? "🐰 Normal" : "🐢 Perlahan"}
              </button>
              <span className="skill-count"><Image size={15} /> {skillWords.length} perkataan</span>
            </div>
          </div>
          <div className="word-card-grid">
            {skillWords.map((word) => (
              <PerkataanWordCard
                key={word}
                word={word}
                isSpeaking={speakingWord === word}
                onSpeak={() => speakWord(word)}
                color={skill.color}
                activeSyllableIndex={speakingWord === word ? activeSyllableIndex : -1}
              />
            ))}
          </div>
        </section>
      )}
    </Fragment>
  );
}

function PerkataanModule({ onBack }) {
  const totalItems = PERKATAAN_SKILLS.reduce((total, skill) => total + perkataanItemCount(skill), 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSkill = PERKATAAN_SKILLS[activeIndex];

  function goToSkill(index) {
    setActiveIndex(Math.max(0, Math.min(PERKATAAN_SKILLS.length - 1, index)));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <div className="home-content hub-content perkataan-module-content">
      <div className="hub-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih kategori Perkataan">
          <ArrowLeft size={18} /> <span>Perkataan</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Image size={15} /> Perkataan <span>/ Words</span></span>
          <h1>{activeSkill.code} · {activeSkill.title || "Perkataan"}</h1>
          <p>Kemahiran {activeIndex + 1} daripada {PERKATAAN_SKILLS.length}</p>
        </div>
        <div className="hub-hero-badge"><BookOpen size={18} /><span><strong>{activeIndex + 1}</strong> / {PERKATAAN_SKILLS.length}</span></div>
      </div>

      <div className="perkataan-nav" role="navigation" aria-label="Pilih kemahiran">
        <button className="nav-skill-button" type="button" onClick={() => goToSkill(activeIndex - 1)} disabled={activeIndex === 0}>
          <ArrowLeft size={16} /> Sebelum
        </button>
        <select
          className="nav-skill-select"
          value={activeSkill.id}
          onChange={(event) => goToSkill(PERKATAAN_SKILLS.findIndex((skill) => skill.id === event.target.value))}
          aria-label="Pilih kemahiran"
        >
          {PERKATAAN_SKILLS.map((skill, index) => (
            <option key={skill.id} value={skill.id}>
              {index + 1}. {skill.code} {skill.title ? `· ${skill.title}` : ""}
            </option>
          ))}
        </select>
        <button className="nav-skill-button" type="button" onClick={() => goToSkill(activeIndex + 1)} disabled={activeIndex === PERKATAAN_SKILLS.length - 1}>
          Selepas <ArrowRight size={16} />
        </button>
      </div>

      <PerkataanSkillSection key={activeSkill.id} skill={activeSkill} />
    </div>
  );
}

