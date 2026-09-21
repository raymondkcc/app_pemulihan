import { useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { AVATARS } from "../../data/appAssets.js";
import { continueAsGuest, listClassFaces, loginStudentWithKad, loginStudentWithPictures } from "../../utils/kembaraStore.js";
import { canRun, tooFrequent } from "../../utils/rateLimit.js";
import PictureLockLogin from "./PictureLockLogin.jsx";
import WhatsAppCta from "./WhatsAppCta.jsx";

export default function StudentClassEntry() {
  const [code, setCode] = useState("");
  const [kad, setKad] = useState("");
  const [faces, setFaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadClass(event) {
    event.preventDefault();
    if (!canRun("class-code", 5000)) {
      tooFrequent("child");
      return;
    }
    setBusy(true);
    const result = await listClassFaces(code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setFaces([]);
      return;
    }
    setError("");
    setFaces(result.faces);
    setSelected(null);
  }

  async function useKad(event) {
    event.preventDefault();
    if (!canRun("kad-login", 3000)) {
      tooFrequent("child");
      return;
    }
    setBusy(true);
    const result = await loginStudentWithKad(kad);
    setBusy(false);
    if (!result.ok) {
      setError(result.error === "locked" ? "Kunci dikunci. Cikgu perlu reset." : result.error);
      return;
    }
    window.location.href = "/murid/ruang";
  }

  function enterGuest() {
    continueAsGuest();
    window.location.href = "/murid/ruang";
  }

  async function submitLock(pictureIds) {
    if (!selected) return;
    if (!canRun("picture-login", 2000)) {
      tooFrequent("child");
      return;
    }
    setBusy(true);
    const result = await loginStudentWithPictures(selected.id, pictureIds);
    setBusy(false);
    if (!result.ok) {
      if (result.error === "locked") setError("Terlalu banyak cubaan. Cikgu perlu buka semula.");
      else if (result.error === "wrong") setError(`Belum tepat. Baki cubaan: ${result.remaining}`);
      else setError(result.error);
      return;
    }
    window.location.href = "/murid/ruang";
  }

  return (
    <main className="portal-page student-entry-page">
      <header className="portal-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={19} /></a>
        <div className="portal-logo"><span>A</span><span>1</span><span>*</span></div>
        <div><span className="portal-kicker">Ruang murid</span><strong>Masuk kelas</strong></div>
      </header>
      <section className="profile-content">
        <div className="portal-intro">
          <h1>Kod kelas anda</h1>
          <p>Taip kod cikgu, imbas kad, atau cuba demo tahap 1 tanpa nama.</p>
        </div>

        <form className="profile-form" onSubmit={loadClass}>
          <label htmlFor="class-code">Kod kelas / Class code</label>
          <input id="class-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={6} placeholder="PINTAR" />
          <button className="profile-submit" type="submit" disabled={busy}>Lihat wajah / See faces <ArrowRight size={18} /></button>
        </form>

        {faces.length > 0 && !selected && (
          <div className="profile-list">
            {faces.map((face) => {
              const item = AVATARS.find((entry) => entry.id === face.avatarId) || AVATARS[0];
              return (
                <button className="profile-card" key={face.id} type="button" disabled={face.locked || !face.hasLock} onClick={() => setSelected(face)}>
                  <span className={`avatar avatar-${item.color}`}><img src={item.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{item.mark}</span></span>
                  <span><strong>{face.nickname}</strong><small>{face.locked ? "Dikunci" : face.hasLock ? "Tekan untuk masuk" : "Kunci belum"}</small></span>
                  <ArrowRight size={19} />
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <PictureLockLogin nickname={selected.nickname} onSubmit={submitLock} />
        )}

        <form className="profile-form" onSubmit={useKad}>
          <label htmlFor="kad-code">Atau kod kad / Or card code</label>
          <input id="kad-code" value={kad} onChange={(event) => setKad(event.target.value.toUpperCase())} placeholder="KANCIL-4821" />
          <button className="profile-submit" type="submit" disabled={busy}>Masuk dengan kad</button>
        </form>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="entry-divider" role="separator"><span>ATAU<small>OR</small></span></div>
        <button className="guest-entry-button" type="button" onClick={enterGuest}>
          <span className="guest-entry-icon" aria-hidden="true">⭐</span>
          <span><strong>Cuba demo tahap 1</strong><small>Continue without a name · first level only</small></span>
          <ArrowRight size={19} />
        </button>
        <WhatsAppCta compact />
      </section>
    </main>
  );
}
