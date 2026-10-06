import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { AVATARS } from "../../data/appAssets.js";
import AdventureLogo from "../home/AdventureLogo.jsx";
import { clearClassSession, continueAsGuest, loginStudentWithClassCode, loginStudentWithPictures, loginStudentWithQrToken } from "../../utils/kembaraStore.js";
import { canRun, tooFrequent } from "../../utils/rateLimit.js";
import PictureLockLogin from "./PictureLockLogin.jsx";
import { formatClassCode } from "../../utils/studentCode.js";

const LOCKED_MESSAGE = "Password gambar dikunci selepas 5 cubaan salah. Sila minta cikgu atau ibu bapa reset password anda.";

export default function StudentClassEntry() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [student, setStudent] = useState(null);
  const [classRecord, setClassRecord] = useState(null);
  const [faces, setFaces] = useState([]);

  async function selectStudent(result) {
    setBusy(false);
    if (!result.ok) {
      setError(result.error === "locked" ? LOCKED_MESSAGE : result.error);
      return;
    }
    setStudent(result.student);
    setError("");
  }

  async function selectClass(result) {
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setClassRecord(result.classRecord);
    setFaces(result.faces);
    setCode(result.classRecord.code);
    setError("");
  }

  useEffect(() => {
    const codeFromQr = new URLSearchParams(window.location.search).get("qr");
    if (!codeFromQr) return;
    let cancelled = false;
    setBusy(true);
    (async () => {
      try {
        const result = await loginStudentWithQrToken(codeFromQr);
        if (!cancelled) await selectStudent(result);
      } catch {
        if (!cancelled) setError("Tidak dapat membaca kod QR. Semak internet dan cuba lagi.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!canRun("student-code-login", 3000)) {
      tooFrequent("child");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await selectClass(await loginStudentWithClassCode(code));
    } catch {
      setError("Tidak dapat log masuk. Semak internet dan cuba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPictures(pictureIds) {
    if (!student) return;
    setBusy(true);
    setError("");
    try {
      const result = await loginStudentWithPictures(student.id, pictureIds);
      if (!result.ok) {
        setError(result.error === "locked" ? LOCKED_MESSAGE : result.error === "wrong" ? "Gambar tidak tepat. Cuba lagi." : result.error);
        return;
      }
      window.location.href = "/murid/ruang";
    } catch {
      setError("Tidak dapat log masuk. Semak internet dan cuba lagi.");
    } finally {
      setBusy(false);
    }
  }

  function enterGuest() {
    continueAsGuest();
    window.location.href = "/murid/ruang";
  }

  function chooseStudent(face) {
    setStudent(face);
    setError("");
  }

  function resetClassEntry() {
    setStudent(null);
    setClassRecord(null);
    setFaces([]);
    setCode("");
    setError("");
    clearClassSession();
  }

  return (
    <main className="portal-page student-entry-page">
      <header className="portal-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={19} /></a>
        <AdventureLogo />
        <div><span className="portal-kicker">Ruang murid</span><strong>Log masuk murid</strong></div>
      </header>
      <section className="profile-content">
        {student ? <><button className="back-button" type="button" disabled={busy} onClick={() => { setStudent(null); setError(""); }}><ChevronLeft size={18} /> Tukar murid</button><PictureLockLogin nickname={student.nickname} onSubmit={submitPictures} disabled={busy} /></> : classRecord ? <>
        <button className="back-button" type="button" disabled={busy} onClick={resetClassEntry}><ChevronLeft size={18} /> Tukar kod kelas</button>
        <div className="portal-intro">
          <h1>Pilih nama murid</h1>
          <p>Kelas <strong>{classRecord.code}</strong>. Pilih nama anda sebelum masukkan password gambar.</p>
        </div>
        <div className="profile-list student-class-list">
          {faces.map((face) => {
            const avatar = AVATARS.find((item) => item.id === face.avatarId) || AVATARS[0];
            return <button className="profile-card student-class-choice" type="button" key={face.id} disabled={busy || face.locked} onClick={() => chooseStudent(face)}>
              <span className={`avatar avatar-${avatar.color}`}><img src={avatar.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{avatar.mark}</span></span>
              <span><strong>{face.nickname}</strong><small>{face.locked ? "Password gambar dikunci" : face.hasLock ? "Sedia untuk masuk" : "Password gambar belum disediakan"}</small></span>
              <ArrowRight size={19} />
            </button>;
          })}
        </div>
        </> : <>
        <div className="portal-intro">
          <h1>{busy && new URLSearchParams(window.location.search).has("qr") ? "Membuka permainan..." : "Kod kelas anda"}</h1>
          <p>{busy && new URLSearchParams(window.location.search).has("qr") ? "Kod login dibaca. Sila tunggu sebentar." : "Masukkan kod kelas yang diberi oleh cikgu untuk menyertai kelas."}</p>
        </div>

        <form className="profile-form" onSubmit={submit}>
          <label htmlFor="student-code">Kod kelas / Class code</label>
          <input
            id="student-code"
            value={code}
            onChange={(event) => setCode(formatClassCode(event.target.value))}
            maxLength={24}
            autoComplete="off"
            required
          />
          <button className="profile-submit" type="submit" disabled={busy}>
            {busy ? "Mencari kelas..." : "Sertai kelas / Join class"} <ArrowRight size={18} />
          </button>
        </form>

        <div className="entry-divider" role="separator"><span>ATAU<small>OR</small></span></div>
        <button className="guest-entry" type="button" disabled={busy} onClick={enterGuest}>
          <span className="guest-entry-spark" aria-hidden="true">✦</span>
          <span className="guest-entry-label">Cuba secara percuma <em>/ Try for free</em></span>
          <ArrowRight size={20} />
        </button>
        </>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
