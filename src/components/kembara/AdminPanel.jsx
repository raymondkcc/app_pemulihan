import { useEffect, useMemo, useState } from "react";
import { Archive, Check, ChevronLeft, Copy, GraduationCap, LogOut, Pencil, Plus, Presentation, QrCode, Shield, X } from "lucide-react";
import { FREE_STUDENT_LIMIT } from "../../data/kembara.js";
import AdventureLogo from "../home/AdventureLogo.jsx";
import {
  bootstrapAdmin,
  createAdult,
  getActiveAdult,
  hasAdmin,
  listStudentsForAdult,
  loadAdminWorkspace,
  logoutAdult,
  makeAdmin,
  refreshAppMeta,
  setAdultActive,
  setAdultLimit,
  updateAdultAccount,
  deleteAdultAccount,
  getDemoConfig,
  setDemoActive,
  whenAuthReady
} from "../../utils/kembaraStore.js";
import { canRun, tooFrequent } from "../../utils/rateLimit.js";
import LoadingScreen from "./LoadingScreen.jsx";
import StudentQrDialog from "./StudentQrDialog.jsx";

export default function AdminPanel() {
  const [phase, setPhase] = useState("loading");
  const [adult, setAdult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await whenAuthReady();
      await refreshAppMeta();
      const current = getActiveAdult();
      if (cancelled) return;
      if (!hasAdmin() && !current) {
        setPhase("bootstrap");
        return;
      }
      if (!current) {
        window.location.replace("/cikgu");
        return;
      }
      if (current.role !== "admin") {
        window.location.replace("/akaun");
        return;
      }
      setAdult(current);
      setPhase("ready");
    })();
    return () => { cancelled = true; };
  }, []);

  if (phase === "loading") {
    return <LoadingScreen />;
  }
  if (phase === "bootstrap") return <BootstrapAdmin />;
  if (!adult) return null;
  return <AdminHome adult={adult} />;
}

function BootstrapAdmin() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await bootstrapAdmin({ name, email, password });
    setBusy(false);
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
        <AdventureLogo />
        <div><span className="portal-kicker">Admin pertama</span><strong>Kembara Pintar</strong></div>
      </header>
      <section className="profile-content">
        <div className="portal-intro">
          <h1>Cipta akaun admin</h1>
          <p>Akaun ini disimpan dalam Firebase Auth dan Firestore. Jika anda sudah cipta pengguna di konsol Firebase, guna e-mel dan kata laluan yang sama.</p>
        </div>
        <form className="profile-form" onSubmit={submit}>
          <label htmlFor="admin-name">Nama</label>
          <input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} required />
          <label htmlFor="admin-email">E-mel</label>
          <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="admin-password">Kata laluan</label>
          <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
          {error && <p className="form-error">{error}</p>}
          <button className="profile-submit" type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan admin"}</button>
        </form>
      </section>
    </main>
  );
}

function AdminHome({ adult }) {
  const [store, setStore] = useState({ adults: [], classes: [], students: [] });
  const [stats, setStats] = useState({ activeAdults: 0, students: 0, classes: 0, tracks: { bm: 0, math: 0, both: 0 } });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qrStudent, setQrStudent] = useState(null);
  const [deletingAdultId, setDeletingAdultId] = useState("");
  const [accountFeedback, setAccountFeedback] = useState(null);
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(false);
  const [demo, setDemo] = useState(getDemoConfig());
  const adults = useMemo(() => store.adults, [store]);
  const activeAdults = useMemo(() => adults.filter((item) => item.active), [adults]);
  const archivedAdults = useMemo(() => adults.filter((item) => !item.active), [adults]);
  const students = useMemo(() => store.students.filter((student) => !student.archived), [store]);

  async function load() {
    const result = await loadAdminWorkspace();
    setStore(result.store);
    setStats(result.stats);
    setDemo(result.demo || getDemoConfig());
  }

  useEffect(() => {
    load();
  }, []);

  async function refresh() {
    if (!canRun("admin-refresh", 30000)) {
      tooFrequent("adult");
      return;
    }
    await load();
  }

  async function addAdult(event) {
    event.preventDefault();
    setBusy(true);
    const result = await createAdult({ name, email, password, role });
    setBusy(false);
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
    await load();
  }

  async function changeLimit(id, limit) {
    const result = await setAdultLimit(id, limit);
    if (!result.ok) setError(result.error);
    await load();
  }

  async function promote(id) {
    const result = await makeAdmin(id);
    if (!result.ok) setError(result.error);
    await load();
  }

  async function toggleActive(item) {
    const result = await setAdultActive(item.id, !item.active);
    if (!result.ok) setError(result.error);
    await load();
  }

  async function saveEdit(values) {
    const result = await updateAdultAccount(editing.id, values);
    if (!result.ok) return result;
    setEditing(null);
    setError("");
    setNotice(`Akaun ${result.adult.email} dikemas kini.`);
    await load();
    return result;
  }

  async function removeAccount(item) {
    if (!window.confirm(`Nyahaktifkan akaun ${item.name}? Data kelas dan murid akan disimpan dan akaun boleh dibuka semula.`)) return;
    setDeletingAdultId(item.id);
    setAccountFeedback(null);
    try {
      const result = await deleteAdultAccount(item.id);
      if (!result.ok) {
        setAccountFeedback({ error: true, message: result.error });
        return;
      }
      setAccountFeedback({ error: false, message: `Akaun ${item.email} telah dinyahaktifkan. Data kelas dan murid disimpan.` });
      try {
        await load();
      } catch {
        setAccountFeedback({ error: true, message: "Akaun telah dinyahaktifkan, tetapi senarai gagal dimuat semula. Tekan Muat semula." });
      }
    } catch (error) {
      setAccountFeedback({ error: true, message: error?.message || "Akaun tidak dapat dinyahaktifkan. Cuba lagi." });
    } finally {
      setDeletingAdultId("");
    }
  }

  return (
    <main className="teacher-page admin-page">
      <header className="teacher-header">
        <a className="portal-back" href="/" aria-label="Kembali / Back"><ChevronLeft size={20} /></a>
        <AdventureLogo />
        <div><span className="portal-kicker">Admin</span><strong>Panel Kembara</strong></div>
        <span className="teacher-badge"><Shield size={16} /> {adult.name}</span>
        <a className="teacher-mode-link" href="/cikgu/mengajar"><Presentation size={16} /> Mod mengajar</a>
        <a className="exit-link" href="/" onClick={async (event) => { event.preventDefault(); await logoutAdult(); window.location.href = "/"; }}><LogOut size={16} /> Keluar</a>
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
        <DemoAccessCard demo={demo} onChange={setDemo} />
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
            <button className="profile-submit" type="submit" disabled={busy}>{busy ? "Membuka akaun..." : "Buka akaun percuma"}</button>
          </form>
        </section>
        <section className="admin-panel-card">
          <div className="section-heading-row">
            <div><span className="section-kicker">Senarai</span><h2><GraduationCap size={18} /> Akaun dewasa</h2></div>
          </div>
          {accountFeedback && <p className={accountFeedback.error ? "form-error" : "form-notice"} role={accountFeedback.error ? "alert" : "status"}>{accountFeedback.message}</p>}
          <div className="admin-adult-list">
            {activeAdults.map((item) => {
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
                    <button type="button" onClick={() => changeLimit(item.id, 30)}>Had 30</button>
                    <button type="button" onClick={() => changeLimit(item.id, 80)}>Had 80</button>
                    {item.role !== "admin" && <button type="button" onClick={() => promote(item.id)}>Jadikan admin</button>}
                    <button type="button" onClick={() => setEditing(item)}><Pencil size={13} /> Edit</button>
                    <button type="button" onClick={() => toggleActive(item)}>Tutup</button>
                    {item.id !== adult.id && <button type="button" className="danger-button" onClick={() => removeAccount(item)} disabled={Boolean(deletingAdultId) || !item.active}>
                      {deletingAdultId === item.id ? "Menyimpan..." : <><Archive size={13} /> Nyahaktifkan</>}
                    </button>}
                  </div>
                </article>
              );
            })}
          </div>
          {archivedAdults.length > 0 && (
            <div className="admin-account-archive">
              <button
                className="archive-toggle"
                type="button"
                aria-expanded={showArchivedAccounts}
                onClick={() => setShowArchivedAccounts((visible) => !visible)}
              >
                <Archive size={16} />
                <span>Akaun diarkibkan ({archivedAdults.length})</span>
                <span aria-hidden="true">{showArchivedAccounts ? "−" : "+"}</span>
              </button>
              {showArchivedAccounts && (
                <div className="admin-adult-list admin-archived-list">
                  {archivedAdults.map((item) => {
                    const seats = listStudentsForAdult(item.id).length;
                    const classRecord = store.classes.find((entry) => entry.ownerId === item.id);
                    return (
                      <article className="admin-adult-row is-disabled" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{item.email} · {item.role} · Akaun ditutup</span>
                          <small>Kod {classRecord?.code || "-"} · Murid {seats}/{item.studentLimit || FREE_STUDENT_LIMIT}</small>
                        </div>
                        <div className="admin-adult-actions">
                          <button type="button" onClick={() => setEditing(item)}><Pencil size={13} /> Edit</button>
                          <button type="button" onClick={() => toggleActive(item)}>Buka semula</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
        <section className="admin-panel-card">
          <div className="section-heading-row">
            <div><span className="section-kicker">Akses murid</span><h2><QrCode size={18} /> QR masuk murid</h2></div>
          </div>
          <div className="admin-student-list">
            {students.length === 0 && <p className="admin-empty-state">Belum ada murid berdaftar.</p>}
            {students.map((student) => {
              const owner = store.adults.find((item) => item.id === student.ownerId);
              return (
                <article className="admin-student-row" key={student.id}>
                  <div>
                    <strong>{student.nickname}</strong>
                    <span>{owner?.name || "Akaun tidak diketahui"} · {student.studentCode || "-"}</span>
                  </div>
                  <button type="button" onClick={() => setQrStudent(student)}><QrCode size={14} /> Jana QR</button>
                </article>
              );
            })}
          </div>
        </section>
      </section>
      {editing && <AdultEditDialog adult={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
      {qrStudent && <StudentQrDialog student={qrStudent} onClose={() => setQrStudent(null)} />}
    </main>
  );
}

function DemoAccessCard({ demo, onChange }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    const result = await setDemoActive(!demo.active);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.demo);
  }

  async function copyLink(role) {
    const token = demo[`${role}Token`];
    const link = `${window.location.origin}/demo/${role}?token=${encodeURIComponent(token)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(role);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Pautan tidak dapat disalin. Salin pautan yang dipaparkan secara manual.");
    }
  }

  const linksReady = demo.active && demo.studentToken && demo.teacherToken;
  return (
    <section className="admin-panel-card demo-access-card">
      <div className="section-heading-row">
        <div><span className="section-kicker">Akses sementara</span><h2><Presentation size={18} /> Demo produk</h2></div>
        <span className={`demo-status ${demo.active ? "is-active" : ""}`}>{demo.active ? "Aktif" : "Tidak aktif"}</span>
      </div>
      <p className="demo-access-copy">Hidupkan dua pautan khas untuk menunjukkan pengalaman murid tanpa had dan dashboard cikgu dengan data contoh.</p>
      <button className={`demo-toggle-button ${demo.active ? "is-active" : ""}`} type="button" onClick={toggle} disabled={busy}>{demo.active ? <Check size={17} /> : <Shield size={17} />}{busy ? "Menyimpan..." : demo.active ? "Nyahaktifkan demo" : "Aktifkan demo"}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
      {linksReady && <div className="demo-link-list">
        <DemoLinkRow label="Pautan murid tanpa had" href={`${window.location.origin}/demo/student?token=${encodeURIComponent(demo.studentToken)}`} onCopy={() => copyLink("student")} copied={copied === "student"} description="Semua permainan, latihan, ujian, peta dan koleksi terbuka." />
        <DemoLinkRow label="Pautan cikgu demo" href={`${window.location.origin}/demo/teacher?token=${encodeURIComponent(demo.teacherToken)}`} onCopy={() => copyLink("teacher")} copied={copied === "teacher"} description="Dashboard baca sahaja dengan tiga murid dan data contoh." />
      </div>}
    </section>
  );
}

function DemoLinkRow({ label, href, description, onCopy, copied }) {
  return (
    <div className="demo-link-row">
      <div><strong>{label}</strong><small>{description}</small><code>{href}</code></div>
      <button type="button" onClick={onCopy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Disalin" : "Salin"}</button>
    </div>
  );
}

function AdultEditDialog({ adult, onClose, onSave }) {
  const [name, setName] = useState(adult.name);
  const [role, setRole] = useState(adult.role);
  const [active, setActive] = useState(adult.active);
  const [studentLimit, setStudentLimit] = useState(adult.studentLimit || FREE_STUDENT_LIMIT);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await onSave({ name, email: adult.email, role, active, studentLimit });
    setBusy(false);
    if (!result?.ok) setError(result?.error || "Tidak berjaya menyimpan.");
  }

  return (
    <div className="student-qr-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-edit-title">
        <div className="student-qr-heading"><div><span className="section-kicker">Akaun dewasa</span><h2 id="admin-edit-title">Edit akaun</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Tutup"><X size={19} /></button></div>
        <form className="profile-form" onSubmit={submit}>
          <label htmlFor="edit-adult-name">Nama</label><input id="edit-adult-name" value={name} onChange={(event) => setName(event.target.value)} required />
          <label htmlFor="edit-adult-email">E-mel log masuk</label><input id="edit-adult-email" type="email" value={adult.email} readOnly aria-describedby="edit-adult-email-note" />
          <small id="edit-adult-email-note">E-mel dan kata laluan diurus dalam Firebase Authentication.</small>
          <label htmlFor="edit-adult-role">Peranan</label><select id="edit-adult-role" value={role} onChange={(event) => setRole(event.target.value)}><option value="teacher">Cikgu</option><option value="parent">Ibu bapa</option><option value="admin">Admin</option></select>
          <label htmlFor="edit-adult-limit">Had murid</label><input id="edit-adult-limit" type="number" min="1" max="500" value={studentLimit} onChange={(event) => setStudentLimit(event.target.value)} required />
          <label className="check-row"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Akaun aktif</label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions"><button className="new-profile-button" type="button" onClick={onClose}>Batal</button><button className="profile-submit" type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan perubahan"}</button></div>
        </form>
      </section>
    </div>
  );
}
