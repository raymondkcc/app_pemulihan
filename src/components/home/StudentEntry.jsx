import { ArrowRight, Check, ChevronLeft, UserRound } from "lucide-react";
import { useState } from "react";
import { AVATARS } from "../../data/appAssets.js";
import { continueAsGuest, createProfile, getProfileStore, setActiveProfile } from "../../utils/profileStore.js";

export default function StudentEntry() {
  const [store, setStore] = useState(getProfileStore);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [creating, setCreating] = useState(store.profiles.length === 0);

  function enter(profileId) { setActiveProfile(profileId); window.location.href = "/murid/ruang"; }
  function enterWithoutName() { continueAsGuest(); window.location.href = "/murid/ruang"; }
  function submit(event) { event.preventDefault(); if (!name.trim()) return; const next = createProfile(name, avatar); setStore(next); enter(next.activeProfileId); }

  return <main className="portal-page student-entry-page"><header className="portal-header"><a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={19} /></a><div className="portal-logo"><span>A</span><span>1</span><span>*</span></div><div><span className="portal-kicker">Ruang murid / Student space</span><strong>Pilih nama anda</strong></div></header><section className="profile-content">
    <div className="portal-intro"><span className="portal-eyebrow"><UserRound size={16} /> Selamat datang, murid!</span><h1>Siapa nama anda?</h1><p>Pilih profil anda atau cipta profil baharu.</p></div>
    {store.profiles.length > 0 && <div className="profile-list">{store.profiles.map((profile) => { const item = AVATARS.find((entry) => entry.id === profile.avatarId) || AVATARS[0]; return <button className="profile-card" key={profile.id} type="button" onClick={() => enter(profile.id)}><span className={`avatar avatar-${item.color}`}><img src={item.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{item.mark}</span></span><span><strong>{profile.nickname}</strong><small>{item.label}</small></span><ArrowRight size={19} /></button>; })}</div>}
    {!creating && <button className="new-profile-button" type="button" onClick={() => setCreating(true)}>+ Cipta profil baharu / New profile</button>}
    {creating && <form className="profile-form" onSubmit={submit}><label htmlFor="nickname">Nama panggilan / Nickname</label><input id="nickname" value={name} onChange={(event) => setName(event.target.value)} maxLength={18} placeholder="Contoh: Aina" autoFocus /><span className="avatar-label">Pilih avatar anda / Choose your avatar</span><div className="avatar-grid">{AVATARS.map((item) => <button key={item.id} className={`avatar-choice avatar-${item.color} ${avatar === item.id ? "is-selected" : ""}`} type="button" onClick={() => setAvatar(item.id)} aria-label={item.label} aria-pressed={avatar === item.id} title={item.label}><img src={item.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{item.mark}</span>{avatar === item.id && <Check size={15} />}</button>)}</div><button className="profile-submit" type="submit" disabled={!name.trim()}>Teruskan / Continue <ArrowRight size={18} /></button></form>}
    <div className="entry-divider" role="separator" aria-label="Atau / Or"><span>ATAU<small>OR</small></span></div>
    <button className="guest-entry-button" type="button" onClick={enterWithoutName}><span className="guest-entry-icon" aria-hidden="true">⭐</span><span><strong>Teruskan tanpa nama</strong><small>Continue without a name</small></span><ArrowRight size={19} /></button>
  </section></main>;
}
