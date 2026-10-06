import { Check, Gift, LogOut, Sparkles, UserRound, X } from "lucide-react";
import { AVATARS } from "../../data/appAssets.js";
import { getMapTheme } from "../../data/mapThemes.js";
import { clearPendingCollectible, readPendingCollectible } from "../../utils/collectibleProgress.js";
import { getActiveStudent, logoutStudent } from "../../utils/kembaraStore.js";
import AdventureLogo from "./AdventureLogo.jsx";
import CollectibleSprite from "./CollectibleSprite.jsx";
import MissionMap from "./MissionMap.jsx";
import { useEffect, useState } from "react";

export default function StudentDashboard() {
  const profile = getActiveStudent();
  const [discovery, setDiscovery] = useState(null);

  useEffect(() => {
    if (profile?.id) setDiscovery(readPendingCollectible(profile.id));
  }, [profile?.id]);

  if (!profile) { window.location.replace("/murid"); return null; }
  const avatar = AVATARS.find((item) => item.id === profile.avatarId) || AVATARS[0];

  function closeDiscovery() {
    clearPendingCollectible(profile.id);
    setDiscovery(null);
  }

  return (
    <main className="dashboard-page student-dashboard-page">
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
        {profile.isDemo && <p className="demo-banner">Demo murid tanpa had: semua peta, koleksi, latihan dan ujian tersedia.</p>}
        {profile.isGuest && <p className="guest-banner">Demo tahap 1 sahaja. Simpan kembara dengan akaun percuma.</p>}
        <MissionMap student={profile} />
      </section>
      {discovery && (
        <div className="collectible-discovery" role="dialog" aria-modal="true" aria-labelledby="collectible-discovery-title">
          <section className="collectible-discovery-card">
            <button className="collectible-discovery-close" type="button" onClick={closeDiscovery} aria-label="Tutup"><X size={19} /></button>
            <span className="collectible-discovery-sparkles" aria-hidden="true"><Sparkles size={17} /><Sparkles size={12} /><Sparkles size={14} /></span>
            <CollectibleSprite item={discovery.item} size="discovery" className="collectible-discovery-mark" />
            <span className="section-kicker"><Gift size={15} /> Jumpaan baharu</span>
            <h2 id="collectible-discovery-title">Hebat, {profile.nickname || "kembara"}!</h2>
            <p>Awak menjumpai <strong>{discovery.item.name}</strong> di {getMapTheme(discovery.mapId).title}.</p>
            <span className="collectible-discovery-count"><Check size={14} /> {discovery.foundCount} daripada {discovery.total} koleksi ditemui</span>
            <button className="collectible-discovery-action" type="button" onClick={closeDiscovery}>Simpan dalam koleksi</button>
          </section>
        </div>
      )}
    </main>
  );
}
