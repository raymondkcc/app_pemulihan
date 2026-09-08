import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Image, Maximize2, Volume2, X } from "lucide-react";
import { PERKATAAN_SKILLS, perkataanItemCount } from "../../data/perkataan.js";
import { splitMalaySyllables } from "../../utils/malaySyllables.js";
import { speakMalayText } from "../../utils/malaySpeech.js";

function PerkataanWordCard({ word, isSpeaking, onSpeak, color = "coral", activeSyllableIndex = -1 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageSrc, setImageSrc] = useState(`/images/perkataan/${word}.png`);

  useEffect(() => {
    setImageFailed(false);
    setImageSrc(`/images/perkataan/${word}.png`);
  }, [word]);

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
  return (
    <strong className="word-syllable-text">
      {splitMalaySyllables(word).map((syllable, index) => (
        <span
          key={`${syllable}-${index}`}
          className={`syllable-part syllable-${index % 2 === 0 ? "first" : "second"} syllable-color-${color} ${index === activeSyllableIndex ? "syllable-active" : ""}`}
        >
          {syllable}
        </span>
      ))}
    </strong>
  );
}

function PerkataanSkillSection({ skill }) {
  const [speakingWord, setSpeakingWord] = useState(null);
  const [activeSyllableIndex, setActiveSyllableIndex] = useState(-1);
  const [speechRate, setSpeechRate] = useState(1);
  const [focusIndex, setFocusIndex] = useState(null);
  const speakingTimer = useRef(null);
  const syllableTimers = useRef([]);
  const sectionRef = useRef(null);
  const fullscreenStartedRef = useRef(false);

  useEffect(() => () => {
    window.clearTimeout(speakingTimer.current);
    syllableTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (focusIndex === null) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") setFocusIndex((current) => Math.max(0, current - 1));
      if (event.key === "ArrowRight") setFocusIndex((current) => Math.min((skill.words || []).length - 1, current + 1));
      if (event.key === "Escape" && !document.fullscreenElement) setFocusIndex(null);
    };
    const handleFullscreenChange = () => {
      if (fullscreenStartedRef.current && !document.fullscreenElement) {
        fullscreenStartedRef.current = false;
        setFocusIndex(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [focusIndex, skill.words]);

  function speakWord(word) {
    if (speakingWord) return;
    setSpeakingWord(word);
    setActiveSyllableIndex(-1);
    window.clearTimeout(speakingTimer.current);
    syllableTimers.current.forEach((timer) => window.clearTimeout(timer));
    syllableTimers.current = [];

    speakMalayText(word, speechRate);
    const syllableCount = splitMalaySyllables(word).length;
    const syllableDuration = speechRate === 1 ? 400 : 700;
    for (let index = 0; index < syllableCount; index += 1) {
      syllableTimers.current.push(window.setTimeout(() => setActiveSyllableIndex(index), index * syllableDuration));
    }
    speakingTimer.current = window.setTimeout(() => {
      setSpeakingWord(null);
      setActiveSyllableIndex(-1);
    }, syllableCount * syllableDuration + 250);
  }

  function toggleSpeed() {
    setSpeechRate((current) => current === 1 ? 0.5 : 1);
  }

  function openFocusMode(index = 0) {
    setFocusIndex(index);
    if (document.fullscreenEnabled && sectionRef.current?.requestFullscreen && !document.fullscreenElement) {
      fullscreenStartedRef.current = true;
      sectionRef.current.requestFullscreen().catch(() => {
        fullscreenStartedRef.current = false;
      });
    }
  }

  function closeFocusMode() {
    setFocusIndex(null);
    fullscreenStartedRef.current = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  const practiceWords = skill.practice || [];
  const skillWords = skill.words || [];
  const groups = [
    { words: practiceWords, label: "Latihan bunyi", countLabel: "bunyi", icon: Volume2, id: "practice" },
    { words: skillWords, label: "Perkataan", countLabel: "perkataan", icon: Image, id: "words" }
  ];

  return (
    <Fragment>
      {groups.filter(({ words }) => words.length > 0).map(({ words, label, countLabel, icon: Icon, id }) => (
        <section
          className="word-skill-section"
          aria-labelledby={`${skill.id}-${id}-title`}
          key={id}
          ref={id === "words" ? sectionRef : undefined}
        >
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">{skill.code} / {label}</span>
              <h2 id={`${skill.id}-${id}-title`}>{skill.title || skill.code}</h2>
              <p>Tekan {label.toLocaleLowerCase("ms-MY")} untuk mendengar sebutan.</p>
            </div>
            <div className="word-section-tools">
              {id === "words" && (
                <button
                  type="button"
                  className="focus-mode-button"
                  onClick={() => openFocusMode(0)}
                  title="Lihat satu perkataan pada satu masa"
                >
                  <Maximize2 size={16} /> Fokus satu-satu
                </button>
              )}
              <button
                type="button"
                className="speed-toggle-btn"
                onClick={toggleSpeed}
                title={speechRate === 1 ? "Kelajuan normal. Tekan untuk perlahan." : "Kelajuan perlahan. Tekan untuk normal."}
              >
                {speechRate === 1 ? "Normal" : "Perlahan"}
              </button>
              <span className="skill-count"><Icon size={15} /> {words.length} {countLabel}</span>
            </div>
          </div>
          <div className="word-card-grid">
            {words.map((word) => (
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

          {id === "words" && focusIndex !== null && words[focusIndex] && (
            <div className={`word-focus-overlay focus-color-${skill.color}`} role="dialog" aria-modal="true" aria-label={`Fokus perkataan ${words[focusIndex]}`}>
              <header className="word-focus-header">
                <span><strong>{skill.code}</strong> · {focusIndex + 1} / {words.length}</span>
                <button type="button" onClick={closeFocusMode} title="Tutup paparan penuh" aria-label="Tutup paparan penuh">
                  <X size={24} />
                </button>
              </header>

              <div className="word-focus-stage">
                <PerkataanWordCard
                  word={words[focusIndex]}
                  isSpeaking={speakingWord === words[focusIndex]}
                  onSpeak={() => speakWord(words[focusIndex])}
                  color={skill.color}
                  activeSyllableIndex={speakingWord === words[focusIndex] ? activeSyllableIndex : -1}
                />
              </div>

              <div className="word-focus-nav">
                <button type="button" onClick={() => setFocusIndex((current) => current - 1)} disabled={focusIndex === 0}>
                  <ArrowLeft size={22} /> Sebelum
                </button>
                <div className="word-focus-dots" aria-hidden="true">
                  {words.map((word, index) => <span className={index === focusIndex ? "is-active" : ""} key={word} />)}
                </div>
                <button type="button" onClick={() => setFocusIndex((current) => current + 1)} disabled={focusIndex === words.length - 1}>
                  Selepas <ArrowRight size={22} />
                </button>
              </div>
            </div>
          )}
        </section>
      ))}
    </Fragment>
  );
}

export default function PerkataanModule({ onBack }) {
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
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke pilihan Perkataan">
          <ArrowLeft size={18} /> <span>Perkataan</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Image size={15} /> Perkataan <span>/ Words</span></span>
          <h1>{activeSkill.code} · {activeSkill.title || "Perkataan"}</h1>
          <p>Kemahiran {activeIndex + 1} daripada {PERKATAAN_SKILLS.length}</p>
        </div>
        <div className="hub-hero-badge"><BookOpen size={18} /><span><strong>{activeIndex + 1}</strong> / {PERKATAAN_SKILLS.length} · {totalItems} item</span></div>
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
          {PERKATAAN_SKILLS.map((skill, index) => <option key={skill.id} value={skill.id}>{index + 1}. {skill.code} {skill.title ? `· ${skill.title}` : ""}</option>)}
        </select>
        <button className="nav-skill-button" type="button" onClick={() => goToSkill(activeIndex + 1)} disabled={activeIndex === PERKATAAN_SKILLS.length - 1}>
          Selepas <ArrowRight size={16} />
        </button>
      </div>

      <PerkataanSkillSection key={activeSkill.id} skill={activeSkill} />
    </div>
  );
}
