import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { LOCK_PICTURES } from "../../data/kembara.js";

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
  const [saving, setSaving] = useState(false);
  const [adultHere, setAdultHere] = useState(false);
  const [practiceNoticeOpen, setPracticeNoticeOpen] = useState(false);
  const [firstSuccessNoticeOpen, setFirstSuccessNoticeOpen] = useState(false);


  function choose(id) {
    const picture = pictureById(id);
    if (!picture) return;

    if (step === "pick1") {
      setPicked([id]);
      setStep("pick2");
      return;
    }

    if (step === "pick2") {
      if (picked[0] === id) {
        setError("Pilih gambar yang lain untuk nombor dua.");
        return;
      }
      const next = [picked[0], id];
      setPicked(next);
      setError("");
      setPractice([]);
      setPracticeWins(0);
      setStep("practice");
      setPracticeNoticeOpen(true);
      return;
    }

    if (step === "practice") {
      const next = [...practice, id];
      if (next.length < 2) {
        setPractice(next);
        return;
      }
      const ok = next[0] === picked[0] && next[1] === picked[1];
      setPractice([]);
      if (!ok) {
        setError("Belum tepat. Tengok semula.");
        return;
      }
      const wins = practiceWins + 1;
      setPracticeWins(wins);
      setError("");
      if (wins >= 2) {
        setStep("confirm");
        return;
      }
      setFirstSuccessNoticeOpen(true);
    }
  }

  const first = pictureById(picked[0]);
  const second = pictureById(picked[1]);
  const firstSlot = step === "practice" ? pictureById(practice[0]) : first;
  const secondSlot = step === "practice" ? pictureById(practice[1]) : second;

  async function saveLock() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await onSave(picked);
      if (result?.ok === false) setError(result.error || "Tidak dapat menyimpan kunci. Cuba lagi.");
    } catch {
      setError("Tidak dapat menyimpan kunci. Semak internet dan cuba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="lock-setup" data-silent-interface>
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
          <button className="profile-submit" type="button" onClick={() => setStep("pick1")}>Mula pilih / Start <ArrowRight size={16} /></button>
        </div>
      )}

      {(step === "pick1" || step === "pick2" || step === "practice") && (
        <>
          <div className="lock-slots">
            <div className={`lock-slot ${firstSlot ? "is-filled" : ""}`}><b>1</b>{firstSlot ? <img src={firstSlot.image} alt={firstSlot.word} /> : <span>{step === "practice" ? "Pilih pertama" : "Pertama"}</span>}</div>
            <div className={`lock-slot ${secondSlot ? "is-filled" : ""}`}><b>2</b>{secondSlot ? <img src={secondSlot.image} alt={secondSlot.word} /> : <span>{step === "practice" ? "Pilih kedua" : "Kedua"}</span>}</div>
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

      {step === "practice" && practiceNoticeOpen && (
        <div className="lock-practice-dialog-backdrop">
          <div className="lock-practice-dialog" role="dialog" aria-modal="true" aria-labelledby="lock-practice-title">
            <span className="section-kicker">Pengesahan kunci</span>
            <h3 id="lock-practice-title">Cuba sendiri</h3>
            <p>Kunci gambar disimpan. Sila masukkan password sekali lagi untuk pengesahan.</p>
            <button className="profile-submit" type="button" autoFocus onClick={() => setPracticeNoticeOpen(false)}>OK</button>
          </div>
        </div>
      )}

      {step === "practice" && firstSuccessNoticeOpen && (
        <div className="lock-practice-dialog-backdrop">
          <div className="lock-practice-dialog" role="dialog" aria-modal="true" aria-labelledby="lock-success-title">
            <span className="section-kicker">Pengesahan kunci</span>
            <h3 id="lock-success-title">Berjaya</h3>
            <p>Berjaya, sila masukkan password sekali lagi!</p>
            <button className="profile-submit" type="button" autoFocus onClick={() => setFirstSuccessNoticeOpen(false)}>OK</button>
          </div>
        </div>
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
          <button className="profile-submit" type="button" disabled={!adultHere || saving} onClick={saveLock}>
            {saving ? "Menyimpan..." : "Simpan kunci / Save lock"} <Check size={16} />
          </button>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="text-link" type="button" disabled={saving} onClick={onCancel}>Batal / Cancel</button>
    </section>
  );
}
