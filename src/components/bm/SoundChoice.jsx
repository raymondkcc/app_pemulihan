import { Volume2 } from "lucide-react";

export default function SoundChoice({ item, index = 0, selected = false, busy = false, onChoose, kind = "vowel" }) {
  const label = item.variant ? `${item.label} ${item.variant}` : item.label;
  return (
    <button
      className={`sound-choice sound-choice-${kind} ${selected ? "is-selected" : ""} ${busy ? "is-speaking" : ""}`}
      style={{ "--sound-index": index }}
      type="button"
      onClick={() => onChoose(item)}
      disabled={busy}
      aria-pressed={selected}
      aria-label={`Dengar bunyi ${label}`}
      title={`Dengar ${label}`}
    >
      <strong>{item.label}</strong>
      {item.variant && <span className="sound-choice-variant">{item.variant}</span>}
      <Volume2 className="sound-choice-icon" size={15} aria-hidden="true" />
    </button>
  );
}
