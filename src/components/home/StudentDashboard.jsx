import { ArrowRight, CheckCircle2, LogOut, RotateCcw, Star, UserRound } from "lucide-react";
import { APP_IMAGES, AVATARS } from "../../data/appAssets.js";
import { demoHrefForTrack, trackLabel } from "../../data/kembara.js";
import { getActiveStudent, logoutStudent } from "../../utils/kembaraStore.js";
import HomeImage from "./HomeImage.jsx";

const cards = [
  { title: "Belajar", english: "Learn", text: "Kenal bunyi dan bina asas.", image: APP_IMAGES.belajar, color: "mint" },
  { title: "Main", english: "Play", text: "Belajar sambil bermain.", image: APP_IMAGES.main, color: "coral" },
  { title: "Uji diri", english: "Test yourself", text: "Cuba apa yang sudah tahu.", image: APP_IMAGES.ujiDiri, color: "lemon" }
];

export default function StudentDashboard() {
  const profile = getActiveStudent();
  if (!profile) { window.location.replace("/murid"); return null; }
  const avatar = AVATARS.find((item) => item.id === profile.avatarId) || AVATARS[0];
  const track = trackLabel(profile.track);
  const showBm = profile.track !== "math";
  const showMath = profile.track !== "bm";
  const missionHref = profile.isGuest ? demoHrefForTrack(profile.track) : (showBm ? "/murid/bahasa-melayu" : "/murid/matematik");
  const cardHref = profile.isGuest ? demoHrefForTrack(profile.track) : (showBm ? "/murid/bahasa-melayu" : "/murid/matematik");

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/"><span>A</span><strong>Kembara Pintar</strong></a>
        <div className="dashboard-actions">
          <a href="/murid" title="Tukar profil / Switch profile" onClick={() => logoutStudent()}>
            <span className={`avatar avatar-small avatar-${avatar.color}`}>
              <img src={avatar.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />
              <span>{avatar.mark}</span>
            </span>
            <span>{profile.nickname}</span>
            <UserRound size={16} />
          </a>
          <a className="exit-link" href="/" onClick={() => logoutStudent()}><LogOut size={16} /><span>Keluar / Exit</span></a>
        </div>
      </header>
      <section className="dashboard-content">
        {profile.isGuest && <p className="guest-banner">Demo tahap 1 sahaja. Simpan kembara dengan akaun percuma.</p>}
        <div className="dashboard-welcome">
          <div>
            <span className="portal-eyebrow"><Star size={16} fill="currentColor" /> Misi hari ini / Today’s mission</span>
            <h1>Hai, {profile.nickname}!</h1>
            <p>{profile.isGuest ? "Cuba tahap pertama. Jejak penuh perlu akaun." : `Jejak ${track.title}: ${track.helper}`}</p>
          </div>
          <div className={`dashboard-avatar avatar-${avatar.color}`}>
            <img src={avatar.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />
            <span>{avatar.mark}</span>
          </div>
        </div>
        <section className="mission-strip">
          <div className="mission-icon"><RotateCcw size={23} /></div>
          <div>
            <span>Teruskan belajar / Continue learning</span>
            <strong>{profile.isGuest ? "Demo: mula dengan satu langkah" : "Mulakan dengan bunyi, perkataan atau kira"}</strong>
          </div>
          <a href={missionHref}>Mula / Start <ArrowRight size={17} /></a>
        </section>
        <section className="dashboard-section">
          <div className="section-heading-row">
            <div><span className="section-kicker">Pilih cara / Choose a way</span><h2>Bagaimana mahu belajar?</h2></div>
            <span className="skill-count"><CheckCircle2 size={15} /> {profile.isGuest ? "Demo" : "Langkah kecil"}</span>
          </div>
          <div className="mode-grid">
            {cards.map((card) => (
              <a className={`mode-card mode-card-${card.color}`} href={cardHref} key={card.title}>
                <HomeImage src={card.image} className="mode-card-image" />
                <span className="mode-card-copy"><strong>{card.title}</strong><span>{card.english}</span><em>{card.text}</em></span>
                <span className="dashboard-card-action" aria-hidden="true"><ArrowRight size={20} /></span>
              </a>
            ))}
          </div>
        </section>
        <section className="dashboard-section subject-section">
          <div className="section-heading-row">
            <div><span className="section-kicker">Subjek / Subjects</span><h2>Pilih ruang belajar</h2></div>
          </div>
          <div className="dashboard-subject-grid">
            {showBm && (
              <a className="dashboard-subject subject-bm" href="/murid/bahasa-melayu">
                <img src={APP_IMAGES.bahasaMelayu3d} alt="" />
                <span><strong>Bahasa Melayu</strong><small>Malay</small></span>
                <span className="dashboard-card-action" aria-hidden="true"><ArrowRight size={20} /></span>
              </a>
            )}
            {showMath && (
              <a className="dashboard-subject subject-math" href={profile.isGuest ? "/addition-regroup" : "/murid/matematik"}>
                <img src={APP_IMAGES.matematik3d} alt="" />
                <span><strong>{profile.isGuest ? "Matematik demo" : "Matematik"}</strong><small>{profile.isGuest ? "Addition only" : "Mathematics"}</small></span>
                <span className="dashboard-card-action" aria-hidden="true"><ArrowRight size={20} /></span>
              </a>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
