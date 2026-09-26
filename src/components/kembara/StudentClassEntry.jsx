import { useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { continueAsGuest, loginStudentWithCode } from "../../utils/kembaraStore.js";
import { canRun, tooFrequent } from "../../utils/rateLimit.js";
import WhatsAppCta from "./WhatsAppCta.jsx";

function formatStudentCode(value) {
  const compact = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.length <= 4) return compact;
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

export default function StudentClassEntry() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!canRun("student-code-login", 3000)) {
      tooFrequent("child");
      return;
    }
    setBusy(true);
    const result = await loginStudentWithCode(code);
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

  return (
    <main className="portal-page student-entry-page">
      <header className="portal-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={19} /></a>
        <div className="portal-logo"><span>A</span><span>1</span><span>*</span></div>
        <div><span className="portal-kicker">Ruang murid</span><strong>Log masuk murid</strong></div>
      </header>
      <section className="profile-content">
        <div className="portal-intro">
          <h1>Kod murid anda</h1>
          <p>Masukkan kod murid yang diberi oleh cikgu, contohnya <strong>JC75-1</strong>.</p>
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

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="entry-divider" role="separator"><span>ATAU<small>OR</small></span></div>
        <button className="guest-entry" type="button" onClick={enterGuest}>Cuba demo tanpa kod / Try demo <ArrowRight size={17} /></button>
        <WhatsAppCta />
      </section>
    </main>
  );
}
