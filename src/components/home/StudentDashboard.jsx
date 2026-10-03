import { LogOut, UserRound } from "lucide-react";
import { AVATARS } from "../../data/appAssets.js";
import { getActiveStudent, logoutStudent } from "../../utils/kembaraStore.js";
import AdventureLogo from "./AdventureLogo.jsx";
import MissionMap from "./MissionMap.jsx";

export default function StudentDashboard() {
  const profile = getActiveStudent();
  if (!profile) { window.location.replace("/murid"); return null; }
  const avatar = AVATARS.find((item) => item.id === profile.avatarId) || AVATARS[0];

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/"><AdventureLogo /><strong>Kembara Pintar</strong></a>
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
        <MissionMap student={profile} />
      </section>
    </main>
  );
}
