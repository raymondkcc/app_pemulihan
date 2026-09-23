import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { hasAdmin, loginAdult, refreshAppMeta, whenAuthReady, getActiveAdult } from "../../utils/kembaraStore.js";
import { canRun, tooFrequent } from "../../utils/rateLimit.js";
import WhatsAppCta from "./WhatsAppCta.jsx";
import LoadingScreen from "./LoadingScreen.jsx";

export default function AdultLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [adminReady, setAdminReady] = useState(hasAdmin());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await whenAuthReady();
      const adult = getActiveAdult();
      if (adult) {
        window.location.replace(adult.role === "admin" ? "/admin" : "/akaun");
        return;
      }
      let exists = false;
      try {
        exists = await refreshAppMeta();
      } catch {
        exists = false;
      }
      if (!cancelled) {
        setAdminReady(exists);
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!canRun("adult-login", 2000)) {
      tooFrequent("adult");
      return;
    }
    setBusy(true);
    setError("");
    const result = await loginAdult(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.href = result.adult.role === "admin" ? "/admin" : "/akaun";
  }

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <main className="portal-page student-entry-page">
      <header className="portal-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={19} /></a>
        <div className="portal-logo"><span>A</span><span>1</span><span>*</span></div>
        <div><span className="portal-kicker">Cikgu & ibu bapa</span><strong>Log masuk</strong></div>
      </header>
      <section className="profile-content">
        <div className="portal-intro">
          <span className="portal-eyebrow">Akaun dewasa</span>
          <h1>Log masuk akaun anda</h1>
          <p>Akaun percuma hanya dibuka oleh admin. WhatsApp kami untuk minta akaun cikgu atau ibu bapa.</p>
          <p>Free accounts are opened by admin only. WhatsApp us to request a teacher or parent login.</p>
        </div>
        <form className="profile-form" onSubmit={submit}>
          <label htmlFor="adult-email">E-mel / Email</label>
          <input id="adult-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" />
          <label htmlFor="adult-password">Kata laluan / Password</label>
          <input id="adult-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="profile-submit" type="submit" disabled={busy}>
            {busy ? "Sedang log masuk..." : "Log masuk / Sign in"} <ArrowRight size={18} />
          </button>
        </form>
        <div className="entry-divider" role="separator"><span>ATAU<small>OR</small></span></div>
        <WhatsAppCta />
        {!adminReady && <p className="portal-note">Admin pertama: buka /admin untuk cipta akaun Firebase, atau log masuk dengan akaun Auth yang sudah ada.</p>}
        <p className="portal-note">Lupa kata laluan? WhatsApp admin. / Forgot password? WhatsApp admin.</p>
      </section>
    </main>
  );
}
