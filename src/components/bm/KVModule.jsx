import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Volume2 } from "lucide-react";
import { E_SOUND_OPTIONS, PACK_ONSETS, PACK_VOWELS, createKvItem, createKvRows } from "../../data/syllablePack.js";
import { playSyllableAudio, stopSyllableAudio } from "../../utils/syllableAudio.js";
import SoundChoice from "./SoundChoice.jsx";

function getVowelItems(eSound) {
  const eVowel = createKvItem("", "e", eSound);
  return [
    { ...createKvItem("", "a", eSound), id: "vowel-a", label: "a", sound: "a" },
    { ...eVowel, id: `vowel-${eSound}`, label: "e", variant: eSound === "e-pepet" ? "pepet" : "taling" },
    { ...createKvItem("", "i", eSound), id: "vowel-i", label: "i", sound: "i" },
    { ...createKvItem("", "o", eSound), id: "vowel-o", label: "o", sound: "o" },
    { ...createKvItem("", "u", eSound), id: "vowel-u", label: "u", sound: "u" }
  ];
}

function KVSoundTable({ selectedItem, onSelect, eSound }) {
  const [activeId, setActiveId] = useState("");
  const rows = createKvRows(eSound);
  const vowelItems = getVowelItems(eSound);

  function chooseItem(item) {
    if (activeId) return;
    onSelect(item);
    setActiveId(item.id);
    playSyllableAudio(item, {
      onEnd: () => setActiveId(""),
      onError: () => setActiveId("")
    });
  }

  return (
    <div className="kv-table-wrap">
      <div className="kv-table" role="table" aria-label="Jadual bunyi KV">
        <div className="kv-table-corner" role="columnheader">Bunyi</div>
        {PACK_VOWELS.map((vowel) => <div className="kv-table-vowel" role="columnheader" key={`head-${vowel}`}>{vowel}</div>)}
        <div className="kv-table-label" role="rowheader">Vokal</div>
        {vowelItems.map((item, index) => <SoundChoice key={item.id} item={item} index={index} kind="table-vowel" selected={selectedItem.id === item.id} busy={Boolean(activeId)} onChoose={chooseItem} />)}
        {PACK_ONSETS.map((onset, rowIndex) => (
          [
            <div className="kv-table-label kv-table-label-kv" role="rowheader" key={`${onset}-label`}>{onset}</div>,
            ...rows[rowIndex].map((item, index) => <SoundChoice key={item.id} item={item} index={index} kind="table-syllable" selected={selectedItem.id === item.id} busy={Boolean(activeId)} onChoose={chooseItem} />)
          ]
        ))}
      </div>
      <div className="letter-selected-card sound-selected-card" role="status" aria-live="polite">
        <span>Bunyi dipilih</span><strong>{selectedItem.label}</strong><em>{activeId ? "Sedang bunyi..." : "Tekan petak untuk dengar"}</em>
      </div>
    </div>
  );
}

export default function KVModule({ onBack }) {
  const [eSound, setESound] = useState("e-pepet");
  const [selectedItem, setSelectedItem] = useState(() => createKvItem("b", "a"));

  function changeESound(nextSound) {
    setESound(nextSound);
    setSelectedItem((current) => current.syllable.endsWith("e") ? createKvItem(current.syllable[0], "e", nextSound) : current);
    stopSyllableAudio();
  }

  return (
    <div className="home-content hub-content sound-module-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke ruang Bahasa Melayu"><ArrowLeft size={18} /> <span>Ruang</span></button>
        <div className="hub-title-block"><span className="hub-eyebrow"><BookOpen size={15} /> KV <span>/ Suku kata</span></span><h1>Buka bunyi KV</h1><p>Tekan mana-mana petak untuk dengar bunyi vokal atau suku kata.</p></div>
        <div className="sound-hero-badge"><BookOpen size={18} /><span><strong>{PACK_ONSETS.length * PACK_VOWELS.length}</strong> bunyi sedia</span></div>
      </div>
      <section className="letter-learning-section kv-learning-section" aria-labelledby="kv-learning-title">
        <div className="section-heading-row"><div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="kv-learning-title">Vokal dan suku kata</h2><p>Pilih mana-mana petak untuk dengar bunyi KV.</p></div><span className="skill-count"><Volume2 size={15} /> Tekan untuk dengar</span></div>
        <div className="e-sound-picker" role="radiogroup" aria-label="Pilih jenis bunyi e"><span className="e-sound-picker-label">Pilih bunyi e</span>{E_SOUND_OPTIONS.map((option) => <button className={`e-sound-option ${eSound === option.id ? "is-selected" : ""}`} type="button" role="radio" aria-checked={eSound === option.id} key={option.id} onClick={() => changeESound(option.id)}><strong>{option.label}</strong><span>{option.hint}</span></button>)}</div>
        <KVSoundTable selectedItem={selectedItem} onSelect={setSelectedItem} eSound={eSound} />
      </section>
      <section className="kv-pond-launch" aria-label="Permainan Lompat Si Katak Lompat"><div><span className="section-kicker">Permainan bunyi</span><strong>Lompat Si Katak Lompat</strong><p>Dengar bunyi KV, kemudian pilih gema yang sama.</p></div><a href="/kv-sound-pond">Main sekarang <ArrowRight size={17} /></a></section>
    </div>
  );
}
