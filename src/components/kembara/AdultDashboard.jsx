import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Check, CheckCircle2, LogOut, Pencil, Presentation, QrCode, UserRound, X } from "lucide-react";
import { AVATARS } from "../../data/appAssets.js";
import MultiplicationReportPanel from "./MultiplicationReportPanel.jsx";
import { loadMultiplicationReport } from "../../games/multiplicationZombie/multiplicationPersistence.js";
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
  updateStudentProfile,
  whenAuthReady
} from "../../utils/kembaraStore.js";
import PictureLockSetup from "./PictureLockSetup.jsx";
import StudentQrDialog from "./StudentQrDialog.jsx";
import LoadingScreen from "./LoadingScreen.jsx";
import { getAssessmentSummary, loadStudentAssessmentResults } from "../../utils/studentAssessments.js";

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
  const [reportStudent, setReportStudent] = useState(null);
  const [reportRows, setReportRows] = useState([]);
  const [reportBusy, setReportBusy] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [qrStudent, setQrStudent] = useState(null);
  const lockSetupRef = useRef(null);
  const [assessmentRows, setAssessmentRows] = useState({});

  async function refresh(currentAdult) {
    const actor = currentAdult || getActiveAdult();
    if (!actor) return;
    await loadAdultWorkspace();
    const nextClass = await ensureAdultClass(actor.id);
    setClassRecord(nextClass);
    const nextStudents = listStudentsForAdult(actor.id);
    setStudents(nextStudents);
    const results = await Promise.all(nextStudents.map(async (student) => [student.id, await loadStudentAssessmentResults(student.id)]));
    setAssessmentRows(Object.fromEntries(results));
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

  useEffect(() => {
    if (!lockStudent) return undefined;
    const frame = window.requestAnimationFrame(() => {
      lockSetupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      lockSetupRef.current?.querySelector("button")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lockStudent?.id]);

  const limit = adult?.studentLimit || FREE_STUDENT_LIMIT;
  const atLimit = students.length >= limit;
  const seatLabel = `Murid ${students.length}/${limit}`;

  if (!ready || !adult || !classRecord) {
    return <LoadingScreen variant="dashboard" />;
  }

  async function showMultiplicationReport(student) {
    setReportStudent(student);
    setReportRows([]);
    setReportBusy(true);
    try {
      const rows = await loadMultiplicationReport(student.id);
      setReportRows(rows);
    } finally {
      setReportBusy(false);
    }
  }

  function closeMultiplicationReport() {
    setReportStudent(null);
    setReportRows([]);
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

        <section className="teaching-entry-card">
          <div className="teaching-entry-icon"><Presentation size={26} /></div>
          <div className="teaching-entry-copy">
            <span className="section-kicker">Untuk mengajar / For teaching</span>
            <h2>Masuk ke mod pengajaran</h2>
            <p>Pilih sebanyak mana subjek dan mod yang mahu anda gunakan bersama murid.</p>
          </div>
          <a className="teaching-entry-button" href="/cikgu/mengajar"><span>Buka mod mengajar</span><small>Teaching mode</small><ArrowRight size={19} /></a>
        </section>
        {lockStudent && (
          <PictureLockSetup
            setupRef={lockSetupRef}
            studentName={lockStudent.nickname}
            onCancel={() => setLockStudent(null)}
            onSave={async (pictureIds) => {
              const result = await setStudentLock(lockStudent.id, pictureIds);
              if (!result.ok) {
                setError(result.error);
                return;
              }
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
              const studentAssessments = assessmentRows[student.id] || [];
              const bmSummary = getAssessmentSummary("bm", studentAssessments);
              const mathSummary = getAssessmentSummary("math", studentAssessments);
              return (
                <div className="profile-card student-manage-card" key={student.id}>
                  <span className={`avatar avatar-${item.color}`}><img src={item.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{item.mark}</span></span>
                  <span>
                    <strong>{student.nickname}</strong>
                    <small>{trackInfo.title} · {student.hasLock ? "Kunci sedia" : "Kunci belum"} · {student.studentCode}</small>
                    <span className="student-progress-grid">
                      <StudentProgress subject="BM" summary={bmSummary} />
                      <StudentProgress subject="Matematik" summary={mathSummary} />
                    </span>
                  </span>
                  <span className="student-manage-actions">
                    <button type="button" onClick={() => setLockStudent(student)}>{student.hasLock ? "Tukar kunci" : "Buat kunci"}</button>
                    <button type="button" onClick={() => setEditStudent(student)}><Pencil size={14} /> Edit</button>
                    <button type="button" onClick={() => setQrStudent(student)}><QrCode size={14} /> QR masuk</button>
                    <button type="button" onClick={() => showMultiplicationReport(student)}><BarChart3 size={14} /> Analisis darab</button>
                    {student.hasLock && <button type="button" onClick={async () => { await resetStudentLock(student.id); await refresh(adult); }}>Reset</button>}
                    <button type="button" onClick={async () => { await archiveStudent(student.id); if (reportStudent?.id === student.id) closeMultiplicationReport(); await refresh(adult); }}>Padam</button>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {reportStudent && <MultiplicationReportPanel student={reportStudent} rows={reportRows} busy={reportBusy} onClose={closeMultiplicationReport} />}

        {editStudent && <StudentEditDialog student={editStudent} onClose={() => setEditStudent(null)} onSave={async (values) => {
          const result = await updateStudentProfile(editStudent.id, values);
          if (result.ok) {
            setEditStudent(null);
            await refresh(adult);
          }
          return result;
        }} />}
        {qrStudent && <StudentQrDialog student={qrStudent} onClose={() => setQrStudent(null)} />}

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

function StudentProgress({ subject, summary }) {
  return (
    <span className="student-progress-block">
      <strong>{`Progress ${subject}: ${summary.passed}/${summary.total}`}</strong>
      <span className="student-progress-skills">
        {summary.results.map((skill) => {
          const result = skill.result;
          const percentage = result ? `${result.percentage}%` : "Belum cuba";
          return <span key={skill.id} className={result?.passed ? "is-passed" : ""}><CheckCircle2 size={12} /> {skill.label}: {percentage}</span>;
        })}
      </span>
    </span>
  );
}

function StudentEditDialog({ student, onClose, onSave }) {
  const [nickname, setNickname] = useState(student.nickname);
  const [avatarId, setAvatarId] = useState(student.avatarId);
  const [track, setTrack] = useState(student.track);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await onSave({ nickname, avatarId, track });
    setBusy(false);
    if (!result?.ok) setError(result?.error || "Tidak berjaya menyimpan.");
  }

  return (
    <div className="student-qr-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="student-edit-title">
        <div className="student-qr-heading"><div><span className="section-kicker">Profil murid</span><h2 id="student-edit-title">Edit murid</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Tutup"><X size={19} /></button></div>
        <form className="profile-form" onSubmit={submit}>
          <label htmlFor="edit-student-name">Nama murid</label><input id="edit-student-name" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={18} required />
          <span className="avatar-label">Jejak / Track</span>
          <div className="track-grid">
            {TRACKS.map((item) => <button className={`track-choice ${track === item.id ? "is-selected" : ""}`} type="button" key={item.id} onClick={() => setTrack(item.id)}><strong>{item.title}</strong><small>{item.english}</small></button>)}
          </div>
          <span className="avatar-label">Pilih avatar</span>
          <div className="avatar-grid">
            {AVATARS.map((item) => <button key={item.id} className={`avatar-choice avatar-${item.color} ${avatarId === item.id ? "is-selected" : ""}`} type="button" onClick={() => setAvatarId(item.id)} aria-label={item.label} aria-pressed={avatarId === item.id}><img src={item.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} /><span>{item.mark}</span>{avatarId === item.id && <Check size={15} />}</button>)}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions"><button className="new-profile-button" type="button" onClick={onClose}>Batal</button><button className="profile-submit" type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan perubahan"}</button></div>
        </form>
      </section>
    </div>
  );
}
