import { useMemo, useState } from "react";
import { ChevronLeft, GraduationCap, LogOut, Plus, Shield } from "lucide-react";
import { FREE_STUDENT_LIMIT } from "../../data/kembara.js";
import {
  bootstrapAdmin,
  createAdult,
  getActiveAdult,
  getDailyStats,
  getKembaraStore,
  hasAdmin,
  listStudentsForAdult,
  logoutAdult,
  makeAdmin,
  setAdultActive,
  setAdultLimit
} from "../../utils/kembaraStore.js";
import { canRun, tooFrequent } from "../../utils/rateLimit.js";

export default function AdminPanel() {
  const adult = getActiveAdult();
  if (!hasAdmin()) return <BootstrapAdmin />;
  if (!adult) {
    window.location.replace("/cikgu");
    return null;
  }
  if (adult.role !== "admin") {
    window.location.replace("/akaun");
    return null;
  }
  return <AdminHome adult={adult} />;
}

function BootstrapAdmin() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const result = bootstrapAdmin({ name, email, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={19} /></a>
        <div className="portal-logo"><span>A</span><span>1</span><span>*</span></div>
        <div><span className="portal-kicker">Admin pertama</span><strong>Kembara Pintar</strong></div>
      </header>
      <section className="profile-content">
        <div className="portal-intro">
          <h1>Cipta akaun admin</h1>
          <p>Akaun ini hanya pada pelayar ini sehingga Firebase disambung. Jangan kongsi kata laluan.</p>
        </div>
        <form className="profile-form" onSubmit={submit}>
          <label htmlFor="admin-name">Nama</label>
          <input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} required />
          <label htmlFor="admin-email">E-mel</label>
          <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="admin-password">Kata laluan</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          {error && <p className="form-error">{error}</p>}
          <button className="profile-submit" type="submit">Simpan admin</button>
        </form>
      </section>
    </main>
  );
}

function AdminHome({ adult }) {
  const [store, setStore] = useState(getKembaraStore);
  const [stats, setStats] = useState(getDailyStats);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const adults = useMemo(() => store.adults, [store]);

  function refresh() {
    if (!canRun("admin-refresh", 30000)) {
      tooFrequent("adult");
      return;
    }
    setStore(getKembaraStore());
    setStats(getDailyStats());
  }

  function addAdult(event) {
    event.preventDefault();
    const result = createAdult({ name, email, password, role });
    if (!result.ok) {
      setError(result.error);
      setNotice("");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setNotice(`Akaun ${result.adult.email} dibuka. Kod kelas: ${result.classRecord.code}`);
    setStore(getKembaraStore());
    setStats(getDailyStats());
  }

  return (
    <main className="teacher-page admin-page">
      <header className="teacher-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={20} /></a>
        <div className="portal-logo"><span>A</span><span>1</span><span>*</span></div>
        <div><span className="portal-kicker">Admin</span><strong>Panel Kembara</strong></div>
        <span className="teacher-badge"><Shield size={16} /> {adult.name}</span>
        <a className="exit-link" href="/" onClick={() => logoutAdult()}><LogOut size={16} /> Keluar</a>
      </header>
      <section className="teacher-content">
        <div className="teacher-intro">
          <h1>Dashboard admin</h1>
          <p>Tambah cikgu atau ibu bapa selepas mereka WhatsApp. Had percuma 10 murid setiap akaun.</p>
        </div>
        <div className="admin-stats">
          <article><span>Akaun dewasa</span><strong>{stats.activeAdults}</strong></article>
          <article><span>Murid</span><strong>{stats.students}</strong></article>
          <article><span>Kelas</span><strong>{stats.classes}</strong></article>
          <article><span>Bacaan / Kira / Kembara</span><strong>{stats.tracks.bm} / {stats.tracks.math} / {stats.tracks.both}</strong></article>
        </div>
        <button className="new-profile-button" type="button" onClick={refresh}>Muat semula / Refresh</button>
        <section className="admin-panel-card">
          <div className="section-heading-row">
            <div><span className="section-kicker">Akaun baru</span><h2><Plus size={18} /> Tambah cikgu / ibu bapa</h2></div>
          </div>
          <form className="profile-form" onSubmit={addAdult}>
            <label htmlFor="new-adult-name">Nama</label>
            <input id="new-adult-name" value={name} onChange={(event) => setName(event.target.value)} required />
            <label htmlFor="new-adult-email">E-mel</label>
            <input id="new-adult-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="new-adult-password">Kata laluan sementara</label>
            <input id="new-adult-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
            <label htmlFor="new-adult-role">Peranan</label>
            <select id="new-adult-role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="teacher">Cikgu</option>
              <option value="parent">Ibu bapa</option>
            </select>
            {error && <p className="form-error">{error}</p>}
            {notice && <p className="form-notice">{notice}</p>}
            <button className="profile-submit" type="submit">Buka akaun percuma</button>
          </form>
        </section>
        <section className="admin-panel-card">
          <div className="section-heading-row">
            <div><span className="section-kicker">Senarai</span><h2><GraduationCap size={18} /> Akaun dewasa</h2></div>
          </div>
          <div className="admin-adult-list">
            {adults.map((item) => {
              const seats = listStudentsForAdult(item.id).length;
              const classRecord = store.classes.find((entry) => entry.ownerId === item.id);
              return (
                <article className={`admin-adult-row ${item.active ? "" : "is-disabled"}`} key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.email} · {item.role} · {item.plan}</span>
                    <small>Kod {classRecord?.code || "-"} · Murid {seats}/{item.studentLimit || FREE_STUDENT_LIMIT}</small>
                  </div>
                  <div className="admin-adult-actions">
                    <button type="button" onClick={() => { setAdultLimit(item.id, 30); setStore(getKembaraStore()); }}>Had 30</button>
                    <button type="button" onClick={() => { setAdultLimit(item.id, 80); setStore(getKembaraStore()); }}>Had 80</button>
                    {item.role !== "admin" && <button type="button" onClick={() => { makeAdmin(item.id); setStore(getKembaraStore()); }}>Jadikan admin</button>}
                    <button type="button" onClick={() => { setAdultActive(item.id, !item.active); setStore(getKembaraStore()); }}>{item.active ? "Tutup" : "Buka"}</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
