import { ArrowRight, BookOpen, Calculator, CheckCircle2, Gamepad2, LogOut, RotateCcw, Star, UserRound } from "lucide-react";
import { APP_IMAGES, AVATARS } from "../../data/appAssets.js";
import { getActiveProfile, getProfileStore } from "../../utils/profileStore.js";
import HomeImage from "./HomeImage.jsx";

const cards = [
  { title: "Belajar", english: "Learn", text: "Kenal bunyi dan bina asas.", image: APP_IMAGES.belajar, color: "mint", href: "/murid/bahasa-melayu" },
  { title: "Main", english: "Play", text: "Belajar sambil bermain.", image: APP_IMAGES.main, color: "coral", href: "/murid/bahasa-melayu" },
  { title: "Uji diri", english: "Test yourself", text: "Cuba apa yang sudah tahu.", image: APP_IMAGES.ujiDiri, color: "lemon", href: "/murid/bahasa-melayu" }
];

export default function StudentDashboard() {
  const profile = getActiveProfile();
  if (!profile) { window.location.replace("/murid"); return null; }
  const avatar = AVATARS.find((item) => item.id === profile.avatarId) || AVATARS[0];
  return <main className="dashboard-page"><header className="dashboard-header"><a className="dashboard-brand" href="/"><span>A</span><strong>Bijak belajar</strong></a><div className="dashboard-actions"><a href="/murid" title="Tukar profil / Switch profile"><span className={`avatar avatar-small avatar-${avatar.color}`}>{avatar.mark}</span><span>{profile.nickname}</span><UserRound size={16} /></a><a className="exit-link" href="/"><LogOut size={16} /><span>Keluar / Exit</span></a></div></header><section className="dashboard-content">
    <div className="dashboard-welcome"><div><span className="portal-eyebrow"><Star size={16} fill="currentColor" /> Misi hari ini / Today’s mission</span><h1>Hai, {profile.nickname}!</h1><p>Pilih satu langkah kecil. Anda boleh belajar, main atau cuba sendiri.</p></div><div className={`dashboard-avatar avatar-${avatar.color}`}>{avatar.mark}</div></div>
    <section className="mission-strip"><div className="mission-icon"><RotateCcw size={23} /></div><div><span>Teruskan belajar / Continue learning</span><strong>Mulakan dengan bunyi dan perkataan</strong></div><a href="/murid/bahasa-melayu">Mula / Start <ArrowRight size={17} /></a></section>
    <section className="dashboard-section"><div className="section-heading-row"><div><span className="section-kicker">Pilih cara / Choose a way</span><h2>Bagaimana mahu belajar?</h2></div><span className="skill-count"><CheckCircle2 size={15} /> Langkah kecil</span></div><div className="mode-grid">{cards.map((card) => <a className={`mode-card mode-card-${card.color}`} href={card.href} key={card.title}><HomeImage src={card.image} className="mode-card-image" /><span className="mode-card-copy"><strong>{card.title}</strong><span>{card.english}</span><em>{card.text}</em></span><ArrowRight size={18} /></a>)}</div></section>
    <section className="dashboard-section subject-section"><div className="section-heading-row"><div><span className="section-kicker">Subjek / Subjects</span><h2>Pilih ruang belajar</h2></div></div><div className="dashboard-subject-grid"><a className="dashboard-subject subject-bm" href="/murid/bahasa-melayu"><BookOpen size={26} /><span><strong>Bahasa Melayu</strong><small>Malay</small></span><ArrowRight size={18} /></a><a className="dashboard-subject subject-math" href="/murid/matematik"><Calculator size={26} /><span><strong>Matematik</strong><small>Mathematics</small></span><ArrowRight size={18} /></a></div></section>
  </section></main>;
}
