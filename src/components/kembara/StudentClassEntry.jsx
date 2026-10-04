import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import AdventureLogo from "../home/AdventureLogo.jsx";
import { continueAsGuest, loginStudentWithCode, loginStudentWithPictures, loginStudentWithQrToken } from "../../utils/kembaraStore.js";
import { canRun, tooFrequent } from "../../utils/rateLimit.js";
import PictureLockLogin from "./PictureLockLogin.jsx";

const LOCKED_MESSAGE = "Password gambar dikunci selepas 5 cubaan salah. Sila minta cikgu atau ibu bapa reset password anda.";

function formatStudentCode(value) {
  const compact = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length < 4) return compact;
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

export default function StudentClassEntry() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [student, setStudent] = useState(null);

  async function selectStudent(result) {
    setBusy(false);
    if (!result.ok) {
      setError(result.error === "locked" ? LOCKED_MESSAGE : result.error);
      return;
    }
    setStudent(result.student);
    setError("");
  }

  useEffect(() => {
    const codeFromQr = new URLSearchParams(window.location.search).get("qr");
    if (!codeFromQr) return;
    let cancelled = false;
    setBusy(true);
    (async () => {
      const result = await loginStudentWithQrToken(codeFromQr);
      if (cancelled) return;
      setBusy(false);
      await selectStudent(result);
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
    const result = await loginStudentWithCode(code);
    setBusy(false);
    await selectStudent(result);
  }

  async function submitPictures(pictureIds) {
    if (!student) return;
    setBusy(true);
    const result = await loginStudentWithPictures(student.id, pictureIds);
    setBusy(false);
    if (!result.ok) {
      setError(result.error === "locked" ? LOCKED_MESSAGE : result.error);
      return;
    }
    window.location.href = "/murid/ruang";
  }

  function enterGuest() {
    continueAsGuest();
    window.location.href = "/murid/ruang";
  }

  return (
    <main className="portal-page student-entry-page">
      <header className="portal-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={19} /></a>
        <AdventureLogo />
        <div><span className="portal-kicker">Ruang murid</span><strong>Log masuk murid</strong></div>
      </header>
      <section className="profile-content">
        {student ? <PictureLockLogin nickname={student.nickname} onSubmit={submitPictures} disabled={busy} /> : <>
        <div className="portal-intro">
          <h1>{busy && new URLSearchParams(window.location.search).has("qr") ? "Membuka permainan..." : "Kod murid anda"}</h1>
          <p>{busy && new URLSearchParams(window.location.search).has("qr") ? "Kod login dibaca. Sila tunggu sebentar." : "Masukkan kod murid yang diberi oleh cikgu untuk log masuk."}</p>
        </div>

        <form className="profile-form" onSubmit={submit}>
          <label htmlFor="student-code">Kod murid / Student code</label>
          <input
            id="student-code"
            value={code}
            onChange={(event) => setCode(formatStudentCode(event.target.value))}
            maxLength={24}
            autoComplete="off"
            required
          />
          <button className="profile-submit" type="submit" disabled={busy}>
            {busy ? "Sedang masuk..." : "Masuk / Log in"} <ArrowRight size={18} />
          </button>
        </form>

        <div className="entry-divider" role="separator"><span>ATAU<small>OR</small></span></div>
        <button className="guest-entry" type="button" onClick={enterGuest}>
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
