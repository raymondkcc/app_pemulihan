import { ArrowRight, BarChart3, BookOpen, Calculator, GraduationCap, LogOut, LockKeyhole, Presentation, UserRound } from "lucide-react";
import { AVATARS } from "../../data/appAssets.js";
import { logoutAdult } from "../../utils/kembaraStore.js";
import AdventureLogo from "../home/AdventureLogo.jsx";

const SAMPLE_STUDENTS = [
  { name: "Aisyah", avatarId: "bunga", track: "Kembara", code: "DEMO-01", bm: "4/5 kemahiran", math: "3/4 kemahiran" },
  { name: "Hakim", avatarId: "roket", track: "Bacaan", code: "DEMO-02", bm: "5/5 kemahiran", math: "Belum mula" },
  { name: "Maya", avatarId: "robot", track: "Kira", code: "DEMO-03", bm: "Belum mula", math: "4/4 kemahiran" }
];

export default function DemoTeacherDashboard() {
  async function exit() {
    await logoutAdult();
    window.location.href = "/";
  }

  return (
    <main className="dashboard-page demo-teacher-page">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/"><AdventureLogo /><strong>Kembara Pintar</strong></a>
        <div className="dashboard-actions">
          <span className="demo-role-badge"><GraduationCap size={15} /> Demo cikgu</span>
          <a href="/cikgu/panduan"><BookOpen size={15} /> Panduan</a>
          <button className="exit-link demo-exit-button" type="button" onClick={exit}><LogOut size={16} /> Keluar</button>
        </div>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-welcome">
          <div>
            <span className="portal-eyebrow"><UserRound size={16} /> Ruang cikgu / teacher space</span>
            <h1>Hai, Cikgu Demo!</h1>
            <p>Ini ialah dashboard contoh dengan data murid prabina. Anda boleh melihat contoh kemajuan dan meneroka mod pengajaran.</p>
          </div>
        </div>

        <section className="teaching-entry-card">
          <div className="teaching-entry-icon"><Presentation size={26} /></div>
          <div className="teaching-entry-copy">
            <span className="section-kicker">Contoh ruang pengajaran</span>
            <h2>Cuba aktiviti bersama murid</h2>
            <p>Buka semua aktiviti Bahasa Melayu dan Matematik dalam mod pengajaran.</p>
          </div>
          <a className="teaching-entry-button" href="/cikgu/mengajar"><span>Buka mod mengajar</span><small>Teaching mode</small><ArrowRight size={19} /></a>
        </section>

        <section className="dashboard-section">
          <div className="section-heading-row">
            <div><span className="section-kicker">Data contoh</span><h2>Wajah kelas</h2></div>
            <span className="skill-count">3 murid contoh</span>
          </div>
          <div className="profile-list">
            {SAMPLE_STUDENTS.map((student) => {
              const avatar = AVATARS.find((item) => item.id === student.avatarId) || AVATARS[0];
              return (
                <div className="profile-card student-manage-card demo-student-card" key={student.code}>
                  <span className={`avatar avatar-${avatar.color}`}><img src={avatar.image} alt="" /><span>{avatar.mark}</span></span>
                  <span>
                    <strong>{student.name}</strong>
                    <small>{student.track} · {student.code}</small>
                    <span className="student-progress-grid">
                      <span className="student-progress-block"><strong><BookOpen size={12} /> Bahasa Melayu</strong><span className="demo-progress-value">{student.bm}</span></span>
                      <span className="student-progress-block"><strong><Calculator size={12} /> Matematik</strong><span className="demo-progress-value">{student.math}</span></span>
                    </span>
                  </span>
                  <span className="student-manage-actions demo-student-actions"><span><BarChart3 size={14} /> Data contoh</span><span><LockKeyhole size={14} /> Prabina</span></span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="demo-read-only-note"><LockKeyhole size={17} /><span><strong>Mod demo baca sahaja</strong><small>Tambah, edit, padam dan QR murid tersedia selepas log masuk ke akaun sebenar.</small></span></div>
      </section>
    </main>
  );
}
