import { ArrowRight, BookOpen, GraduationCap, HeartHandshake, Sparkles } from "lucide-react";
import { APP_IMAGES } from "../../data/appAssets.js";
import HomeImage from "./HomeImage.jsx";

function RoleCard({ image, Icon, title, english, description, color, href }) {
  return <a className={`role-card role-card-${color}`} href={href}>
    <HomeImage src={image} alt="" className="role-card-image" />
    <span className="role-card-icon"><Icon size={24} /></span>
    <span className="role-card-copy"><strong>{title}</strong><span>{english}</span><em>{description}</em></span>
    <span className="role-card-action">Mula / Start <ArrowRight size={18} /></span>
  </a>;
}

export default function RoleChooser() {
  return <main className="portal-page">
    <header className="portal-header"><div className="portal-logo"><span>A</span><span>1</span><span>*</span></div><div><span className="portal-kicker">Ruang belajar / Learning space</span><strong>Bijak belajar</strong></div><span className="portal-status"><Sparkles size={15} /> Jom mula!</span></header>
    <section className="portal-content">
      <div className="portal-intro"><span className="portal-eyebrow"><HeartHandshake size={16} /> Selamat datang / Welcome</span><h1>Siapa yang sedang belajar?</h1><p>Pilih ruang yang sesuai untuk kita mula bermain, belajar dan mencuba.</p></div>
      <div className="role-grid">
        <RoleCard image={APP_IMAGES.studentWelcome} Icon={BookOpen} color="coral" title="Saya murid" english="I am a student" description="Pilih misi kecil dan belajar ikut langkah sendiri." href="/murid" />
        <RoleCard image={APP_IMAGES.teacherWelcome} Icon={GraduationCap} color="blue" title="Saya cikgu / ibu bapa" english="I am a teacher / parent" description="Pilih aktiviti, sediakan soalan dan belajar bersama." href="/cikgu" />
      </div>
      <p className="portal-note"><Sparkles size={15} /> Tiada akaun diperlukan / No account needed</p>
    </section>
  </main>;
}
