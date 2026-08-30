import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, LoaderCircle, Volume2 } from "lucide-react";
import { loadKvkPack, syllableAudioPath } from "../../data/syllablePack.js";
import { playSyllableAudio, stopSyllableAudio } from "../../utils/syllableAudio.js";

const ENDING_OPTIONS = ["semua", "s", "m", "n", "t", "h", "p", "k", "l", "r"];
const E_SOUND_OPTIONS = [
  { id: "semua", label: "Semua bunyi" },
  { id: "standard", label: "Bunyi biasa" },
  { id: "e-pepet", label: "e pepet" },
  { id: "e-taling", label: "e taling" }
];

function itemKey(item) {
  return `${item.syllable}-${item.sound}`;
}

function KvkAudioCard({ item, activeKey, onPlay }) {
  const active = activeKey === itemKey(item);
  return (
    <button className={`kvk-sound-card ${active ? "is-speaking" : ""}`} type="button" onClick={() => onPlay(item)} disabled={Boolean(activeKey)} aria-label={`Dengar ${item.syllable}`} title={`Dengar ${item.syllable}`}>
      <span className="kvk-sound-label">{item.syllable}</span>
      <span className="kvk-sound-detail">{item.sound === "e-pepet" ? "e pepet" : item.sound === "e-taling" ? "e taling" : "bunyi biasa"}</span>
      <span className="kvk-sound-action"><Volume2 size={15} /> {active ? "Sedang bunyi" : "Dengar"}</span>
    </button>
  );
}

export default function KVKLearning({ onBack }) {
  const [items, setItems] = useState([]);
  const [ending, setEnding] = useState("semua");
  const [sound, setSound] = useState("semua");
  const [activeKey, setActiveKey] = useState("");
  const [status, setStatus] = useState("Memuatkan bunyi KVK...");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadKvkPack()
      .then((pack) => {
        if (!mountedRef.current) return;
        setItems(pack);
        setStatus("");
      })
      .catch((error) => mountedRef.current && setStatus(error.message || "Bunyi KVK tidak dapat dimuatkan."));
    return () => {
      mountedRef.current = false;
      stopSyllableAudio();
    };
  }, []);

  const visibleItems = useMemo(() => items.filter((item) => (ending === "semua" || item.syllable.endsWith(ending)) && (sound === "semua" || item.sound === sound)), [ending, items, sound]);

  function playItem(item) {
    if (activeKey || !syllableAudioPath(item)) return;
    setActiveKey(itemKey(item));
    playSyllableAudio(item, {
      onEnd: () => mountedRef.current && setActiveKey(""),
      onError: () => mountedRef.current && setActiveKey("")
    });
  }

  return (
    <div className="home-content hub-content kvk-learning-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke pilihan suku kata"><ArrowLeft size={18} /> <span>Suku Kata</span></button>
        <div className="hub-title-block"><span className="hub-eyebrow"><BookOpen size={15} /> KVK <span>/ Pintu bunyi</span></span><h1>Dengar bunyi KVK</h1><p>Tekan Dengar pada mana-mana suku kata. Bunyi hanya dimainkan apabila anda menekan.</p></div>
        <div className="sound-hero-badge"><Volume2 size={18} /><span><strong>{visibleItems.length}</strong> bunyi dipaparkan</span></div>
      </div>

      <section className="letter-learning-section kvk-learning-section" aria-labelledby="kvk-learning-title">
        <div className="section-heading-row"><div><span className="section-kicker">Aktiviti 01 / Dengar</span><h2 id="kvk-learning-title">Pintu KVK</h2><p>Audio tempatan digunakan supaya sebutan e pepet lebih tepat.</p></div><span className="skill-count"><Volume2 size={15} /> Satu bunyi pada satu masa</span></div>
        <div className="kvk-filter-row">
          <label className="kvk-filter"><span>Akhiran</span><select value={ending} onChange={(event) => { stopSyllableAudio(); setActiveKey(""); setEnding(event.target.value); }}><option value="semua">Semua</option>{ENDING_OPTIONS.slice(1).map((option) => <option key={option} value={option}>-{option}</option>)}</select></label>
          <label className="kvk-filter"><span>Bunyi vokal e</span><select value={sound} onChange={(event) => { stopSyllableAudio(); setActiveKey(""); setSound(event.target.value); }}>{E_SOUND_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
        </div>
        {status && <p className="kvk-load-status" role="status"><LoaderCircle size={16} /> {status}</p>}
        {!status && <div className="kvk-sound-grid" aria-label="Suku kata KVK"><div className="kvk-sound-grid-inner">{visibleItems.map((item) => <KvkAudioCard key={itemKey(item)} item={item} activeKey={activeKey} onPlay={playItem} />)}</div></div>}
        {!status && !visibleItems.length && <p className="kvk-empty-state">Tiada bunyi untuk pilihan ini.</p>}
      </section>
    </div>
  );
}
