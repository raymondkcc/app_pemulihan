import { useEffect, useState } from "react";
import { ArrowRight, Check, LogOut, UserRound } from "lucide-react";
import { AVATARS } from "../../data/appAssets.js";
import { FREE_STUDENT_LIMIT, TRACKS, WHATSAPP_LINK, trackLabel } from "../../data/kembara.js";
import {
  addStudent,
  archiveStudent,
  ensureAdultClass,
  getActiveAdult,
  listStudentsForAdult,
  loadAdultWorkspace,
  logoutAdult,
  resetStudentLock,
  setStudentLock,
  whenAuthReady
} from "../../utils/kembaraStore.js";
import PictureLockSetup from "./PictureLockSetup.jsx";

export default function AdultDashboard() {
  const [adult, setAdult] = useState(null);
  const [students, setStudents] = useState([]);
  const [classRecord, setClassRecord] = useState(null);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [track, setTrack] = useState("both");
  const [error, setError] = useState("");
  const [lockStudent, setLockStudent] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh(currentAdult) {
    const actor = currentAdult || getActiveAdult();
    if (!actor) return;
    await loadAdultWorkspace();
    const nextClass = await ensureAdultClass(actor.id);
    setClassRecord(nextClass);
    setStudents(listStudentsForAdult(actor.id));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await whenAuthReady();
      const current = getActiveAdult();
      if (!current) {
        window.location.replace("/cikgu");
        return;
      }
      if (cancelled) return;
      setAdult(current);
      await refresh(current);
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const limit = adult?.studentLimit || FREE_STUDENT_LIMIT;
  const atLimit = students.length >= limit;
  const seatLabel = `Murid ${students.length}/${limit}`;

  if (!ready || !adult || !classRecord) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-content">
          <p className="portal-note">Menyambung Firebase...</p>
        </section>
      </main>
    );
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const result = await addStudent({ nickname, avatarId: avatar, track });
    setBusy(false);
    if (!result.ok) {
      setError(result.error === "limit" ? `Had percuma: ${limit} murid.` : result.error);
      return;
    }
    setNickname("");
    setError("");
    setLockStudent(result.student);
    await refresh(adult);
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/"><span>A</span><strong>Kembara Pintar</strong></a>
        <div className="dashboard-actions">
          <span className="seat-meter">{seatLabel}</span>
          {adult.role === "admin" && <a href="/admin">Admin</a>}
          <a href="/cikgu/panduan">Panduan</a>
          <a className="exit-link" href="/" onClick={async (event) => { event.preventDefault(); await logoutAdult(); window.location.href = "/"; }}><LogOut size={16} /><span>Keluar / Exit</span></a>
        </div>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <div>
            <span className="portal-eyebrow"><UserRound size={16} /> Ruang cikgu / ibu bapa</span>
            <h1>Hai, {adult.name}!</h1>
            <p>Kod kelas: <strong>{classRecord.code}</strong>. Tambah hingga {limit} murid. Setiap anak pilih Bacaan, Kira, atau Kembara.</p>
          </div>
        </div>

        {lockStudent && (
          <PictureLockSetup
            studentName={lockStudent.nickname}
            onCancel={() => setLockStudent(null)}
            onSave={async (pictureIds) => {
              await setStudentLock(lockStudent.id, pictureIds);
              setLockStudent(null);
              await refresh(adult);
            }}
          />
        )}

        <section className="dashboard-section">
          <div className="section-heading-row">
            <div><span className="section-kicker">Murid anda</span><h2>Wajah kelas</h2></div>
            <span className="skill-count">{seatLabel}</span>
          </div>
          <div className="profile-list">
            {students.map((student) => {
              const item = AVATARS.find((entry) => entry.id === student.avatarId) || AVATARS[0];
              const trackInfo = trackLabel(student.track);
              return (
                <div className="profile-card student-manage-card" key={student.id}>
                  <span className={`avatar avatar-${item.color}`}><img src={item.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{item.mark}</span></span>
                  <span>
                    <strong>{student.nickname}</strong>
                    <small>{trackInfo.title} · {student.hasLock ? "Kunci sedia" : "Kunci belum"} · {student.kadCode}</small>
                  </span>
                  <span className="student-manage-actions">
                    <button type="button" onClick={() => setLockStudent(student)}>{student.hasLock ? "Tukar kunci" : "Buat kunci"}</button>
                    {student.hasLock && <button type="button" onClick={async () => { await resetStudentLock(student.id); await refresh(adult); }}>Reset</button>}
                    <button type="button" onClick={async () => { await archiveStudent(student.id); await refresh(adult); }}>Padam</button>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading-row">
            <div><span className="section-kicker">Tambah</span><h2>Murid baharu</h2></div>
          </div>
          {atLimit ? (
            <div className="limit-banner">
              <p><strong>Had percuma: {limit} murid. WhatsApp admin untuk naik taraf.</strong></p>
              <p>Free limit: {limit} students. WhatsApp admin to upgrade.</p>
              <a className="whatsapp-button" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">WhatsApp admin / WhatsApp admin</a>
            </div>
          ) : (
            <form className="profile-form" onSubmit={submit}>
              <label htmlFor="student-nickname">Nama panggilan / Nickname</label>
              <input id="student-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={18} required />
              <span className="avatar-label">Jejak / Track</span>
              <div className="track-grid">
                {TRACKS.map((item) => (
                  <button className={`track-choice ${track === item.id ? "is-selected" : ""}`} type="button" key={item.id} onClick={() => setTrack(item.id)}>
                    <strong>{item.title}</strong>
                    <small>{item.english}</small>
                  </button>
                ))}
              </div>
              <span className="avatar-label">Pilih avatar / Choose avatar</span>
              <div className="avatar-grid">
                {AVATARS.map((item) => (
                  <button key={item.id} className={`avatar-choice avatar-${item.color} ${avatar === item.id ? "is-selected" : ""}`} type="button" onClick={() => setAvatar(item.id)} aria-label={item.label}>
                    <img src={item.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />
                    <span>{item.mark}</span>
                    {avatar === item.id && <Check size={15} />}
                  </button>
                ))}
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="profile-submit" type="submit" disabled={busy}>
                {busy ? "Menambah..." : "Tambah murid / Add student"} <ArrowRight size={18} />
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}
