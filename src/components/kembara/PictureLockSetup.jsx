import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { LOCK_PICTURES } from "../../data/kembara.js";
import { speakMalayText, speakWithBrowser } from "../../utils/malaySpeech.js";

const STEPS = ["show", "pick1", "pick2", "practice", "confirm"];

function pictureById(id) {
  return LOCK_PICTURES.find((item) => item.id === id);
}

export default function PictureLockSetup({ studentName, onCancel, onSave }) {
  const [step, setStep] = useState("show");
  const [picked, setPicked] = useState([]);
  const [practice, setPractice] = useState([]);
  const [practiceWins, setPracticeWins] = useState(0);
  const [error, setError] = useState("");
  const [adultHere, setAdultHere] = useState(false);

  function speak(word) {
    speakMalayText(word);
  }

  function prompt(text) {
    speakWithBrowser(text);
  }

  function choose(id) {
    const picture = pictureById(id);
    if (!picture) return;

    if (step === "pick1") {
      setPicked([id]);
      speak(picture.word);
      setStep("pick2");
      prompt("Tekan gambar kedua.");
      return;
    }

    if (step === "pick2") {
      if (picked[0] === id) {
        setError("Pilih gambar yang lain untuk nombor dua.");
        return;
      }
      const next = [picked[0], id];
      setPicked(next);
      speak(picture.word);
      setError("");
      setPractice([]);
      setPracticeWins(0);
      setStep("practice");
      prompt("Cuba sendiri. Tekan yang pertama, kemudian yang kedua.");
      return;
    }

    if (step === "practice") {
      const next = [...practice, id];
      speak(picture.word);
      if (next.length < 2) {
        setPractice(next);
        return;
      }
      const ok = next[0] === picked[0] && next[1] === picked[1];
      setPractice([]);
      if (!ok) {
        setError("Belum tepat. Tengok semula.");
        prompt("Belum tepat. Tengok semula.");
        return;
      }
      const wins = practiceWins + 1;
      setPracticeWins(wins);
      setError("");
      if (wins >= 2) {
        setStep("confirm");
        prompt("Ibu bapa atau cikgu, nampak dua gambar ini?");
        return;
      }
      prompt("Bagus. Cuba sekali lagi.");
    }
  }

  const first = pictureById(picked[0]);
  const second = pictureById(picked[1]);

  return (
    <section className="lock-setup">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Kunci gambar / Picture lock</span>
          <h2>Dua gambar untuk {studentName}</h2>
          <p>Kita pilih dua gambar. Ingat susunan. Yang pertama, kemudian yang kedua.</p>
        </div>
        <span className="skill-count">Langkah {STEPS.indexOf(step) + 1} / {STEPS.length}</span>
      </div>

      {step === "show" && (
        <div className="lock-copy-card">
          <p>Cikgu atau ibu bapa mesti ada bersama. Anak tekan, orang dewasa tengok.</p>
          <button className="profile-submit" type="button" onClick={() => { setStep("pick1"); prompt("Tekan gambar pertama."); }}>Mula pilih / Start <ArrowRight size={16} /></button>
        </div>
      )}

      {(step === "pick1" || step === "pick2" || step === "practice") && (
        <>
          <div className="lock-slots">
            <div className={`lock-slot ${picked[0] ? "is-filled" : ""}`}><b>1</b>{first ? <img src={first.image} alt={first.word} /> : <span>Pertama</span>}</div>
            <div className={`lock-slot ${picked[1] ? "is-filled" : ""}`}><b>2</b>{second ? <img src={second.image} alt={second.word} /> : <span>Kedua</span>}</div>
          </div>
          {step === "practice" && <p className="lock-practice">Cuba sendiri. Betul berturut: {practiceWins}/2</p>}
          <div className="lock-grid">
            {LOCK_PICTURES.map((item) => (
              <button className="lock-tile" type="button" key={item.id} onClick={() => choose(item.id)} aria-label={item.word}>
                <img src={item.image} alt="" />
                <span>{item.word}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "confirm" && first && second && (
        <div className="lock-confirm">
          <div className="lock-slots">
            <div className="lock-slot is-filled"><b>1</b><img src={first.image} alt={first.word} /><span>{first.word}</span></div>
            <div className="lock-slot is-filled"><b>2</b><img src={second.image} alt={second.word} /><span>{second.word}</span></div>
          </div>
          <label className="lock-adult-check">
            <input type="checkbox" checked={adultHere} onChange={(event) => setAdultHere(event.target.checked)} />
            Saya ada bersama anak / I am with the child
          </label>
          <button className="profile-submit" type="button" disabled={!adultHere} onClick={() => onSave(picked)}>
            Simpan kunci / Save lock <Check size={16} />
          </button>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="text-link" type="button" onClick={onCancel}>Batal / Cancel</button>
    </section>
  );
}
