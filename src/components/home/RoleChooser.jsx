import { ArrowRight, Sparkles } from "lucide-react";
import { APP_IMAGES } from "../../data/appAssets.js";
import HomeImage from "./HomeImage.jsx";

function RoleCard({ image, imageAlt, title, english, color, href }) {
  return <a className={`role-card role-card-${color}`} href={href} aria-label={`${title}, ${english}`}>
    <HomeImage src={image} alt={imageAlt} className="role-card-image" />
    <span className="role-card-copy"><strong>{title}</strong><span>{english}</span></span>
    <span className="role-card-action" aria-hidden="true"><ArrowRight size={22} /></span>
  </a>;
}

export default function RoleChooser() {
  return <main className="portal-page role-chooser-page">
    <header className="portal-header"><div className="portal-logo"><span>A</span><span>1</span><span>*</span></div><div><strong>Bijak belajar</strong><span className="portal-kicker">Ruang belajar</span></div><span className="portal-status"><Sparkles size={15} /> Jom mula!</span></header>
    <section className="portal-content">
      <div className="portal-intro"><h1>Saya adalah...</h1><p>Pilih satu / Choose one</p></div>
      <div className="role-grid">
        <RoleCard image={APP_IMAGES.studentWelcome} imageAlt="Murid sedang membaca buku" color="coral" title="Murid" english="Student" href="/murid" />
        <RoleCard image={APP_IMAGES.teacherWelcome} imageAlt="Ibu belajar bersama anak" color="blue" title="Cikgu & ibu bapa" english="Teacher & parent" href="/cikgu" />
      </div>
      <p className="portal-note"><Sparkles size={15} /> Terus pilih dan mula</p>
    </section>
  </main>;
}
