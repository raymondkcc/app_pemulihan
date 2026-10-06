import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { useState } from "react";
import { APP_IMAGES } from "../../data/appAssets.js";
import AdventureLogo from "./AdventureLogo.jsx";
import HomeImage from "./HomeImage.jsx";
import { loginAdultWithGoogle } from "../../utils/kembaraStore.js";

function RoleCard({ image, imageAlt, title, english, color, href }) {
  return <a className={`role-card role-card-${color}`} href={href} aria-label={`${title}, ${english}`}>
    <HomeImage src={image} alt={imageAlt} className="role-card-image" />
    <span className="role-card-copy"><strong>{title}</strong><span>{english}</span></span>
    <span className="role-card-action" aria-hidden="true"><ArrowRight size={22} /></span>
  </a>;
}

export default function RoleChooser() {
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");

  async function signInWithGoogle() {
    if (googleBusy) return;
    setGoogleBusy(true);
    setGoogleError("");
    const result = await loginAdultWithGoogle();
    if (!result.ok) {
      setGoogleError(result.error);
      setGoogleBusy(false);
      return;
    }
    window.location.href = result.adult.role === "admin" ? "/admin" : "/akaun";
  }

  return <main className="portal-page role-chooser-page">
    <header className="portal-header"><AdventureLogo /><div><strong>Kembara Pintar</strong><span className="portal-kicker">Peta belajar</span></div><span className="portal-status"><Compass size={15} /> Jom mula!</span></header>
    <section className="portal-content">
      <div className="portal-intro"><span className="portal-eyebrow"><Compass size={15} /> Kembara pembelajaran</span><h1>Siapa pengembara hari ini?</h1><p>Pilih laluan anda untuk memulakan kembara.</p></div>
      <div className="role-grid">
        <RoleCard image={APP_IMAGES.studentWelcome} imageAlt="Murid sedang membaca buku" color="coral" title="Murid" english="Student" href="/murid" />
        <RoleCard image={APP_IMAGES.teacherWelcome} imageAlt="Ibu belajar bersama anak" color="blue" title="Cikgu & ibu bapa" english="Teacher & parent" href="/cikgu" />
      </div>
      <div className="google-entry-block">
        <button className="google-entry-button" type="button" onClick={signInWithGoogle} disabled={googleBusy}>
          <span className="google-entry-mark" aria-hidden="true">G</span>
          <span>{googleBusy ? "Membuka Google..." : "Log masuk dengan Google"}<small>Cikgu Delima / @moe-dl.edu.my</small></span>
          <ArrowRight size={19} />
        </button>
        {googleError && <p className="form-error" role="alert">{googleError}</p>}
      </div>
      <p className="portal-note"><Sparkles size={15} /> Lengkapkan misi untuk membuka laluan seterusnya</p>
    </section>
  </main>;
}
