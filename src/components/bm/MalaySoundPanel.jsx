import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { playSyllableAudio, stopSyllableAudio } from "../../utils/syllableAudio.js";
import { speakMalayText } from "../../utils/malaySpeech.js";
import SoundChoice from "./SoundChoice.jsx";

export default function MalaySoundPanel({ items, selectedItem, onSelect, title, description, kind = "vowel" }) {
  const [activeId, setActiveId] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
    stopSyllableAudio();
  }, []);

  function chooseItem(item) {
    if (activeId) return;
    onSelect(item);
    setActiveId(item.id);
    const callbacks = {
      onEnd: () => mountedRef.current && setActiveId(""),
      onError: () => mountedRef.current && setActiveId("")
    };
    if (!playSyllableAudio(item, callbacks)) {
      speakMalayText(item.sound);
      window.setTimeout(() => mountedRef.current && setActiveId(""), 900);
    }
  }

  return (
    <div className={`letter-panel sound-learning-panel sound-learning-panel-${kind}`}>
      <div className="letter-panel-heading">
        <span className="section-kicker">Aktiviti 01 / Dengar</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className={`sound-choice-row sound-choice-row-${kind}`} aria-label={`Pilih ${title.toLowerCase()}`}>
        {items.map((item, index) => (
          <SoundChoice key={item.id} item={item} index={index} kind={kind} selected={selectedItem.id === item.id} busy={Boolean(activeId)} onChoose={chooseItem} />
        ))}
      </div>
      <div className="letter-selected-card sound-selected-card" role="status" aria-live="polite">
        <span>Bunyi dipilih</span>
        <strong>{selectedItem.variant ? `${selectedItem.label} ${selectedItem.variant}` : selectedItem.label}</strong>
        <em>{activeId ? "Sedang bunyi..." : "Tekan petak untuk dengar"}</em>
        <Volume2 size={16} aria-hidden="true" />
      </div>
    </div>
  );
}
