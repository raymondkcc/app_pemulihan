import { useState } from "react";
import { LOCK_PICTURES } from "../../data/kembara.js";
import { speakMalayText } from "../../utils/malaySpeech.js";

export default function PictureLockLogin({ nickname, onSubmit, disabled }) {
  const [picked, setPicked] = useState([]);

  function choose(id) {
    const picture = LOCK_PICTURES.find((item) => item.id === id);
    if (picture) speakMalayText(picture.word);
    const next = picked.length >= 2 ? [id] : [...picked, id];
    setPicked(next);
    if (next.length === 2) onSubmit(next);
  }

  return (
    <section className="lock-login">
      <h2>Hai, {nickname}</h2>
      <p>Tekan gambar pertama, kemudian yang kedua.</p>
      <div className="lock-slots">
        <div className={`lock-slot ${picked[0] ? "is-filled" : ""}`}><b>1</b>{picked[0] ? <img src={LOCK_PICTURES.find((item) => item.id === picked[0])?.image} alt="" /> : null}</div>
        <div className={`lock-slot ${picked[1] ? "is-filled" : ""}`}><b>2</b>{picked[1] ? <img src={LOCK_PICTURES.find((item) => item.id === picked[1])?.image} alt="" /> : null}</div>
      </div>
      <div className="lock-grid">
        {LOCK_PICTURES.map((item) => (
          <button className={`lock-tile ${picked.includes(item.id) ? "is-selected" : ""}`} type="button" key={item.id} disabled={disabled} onClick={() => choose(item.id)} aria-label={item.word}>
            <img src={item.image} alt="" />
            <span>{item.word}</span>
          </button>
        ))}
      </div>
      <button className="text-link" type="button" onClick={() => setPicked([])}>Cuba semula gambar / Reset pictures</button>
    </section>
  );
}
