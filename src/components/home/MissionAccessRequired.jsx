import { ArrowLeft, LockKeyhole, Map } from "lucide-react";

export default function MissionAccessRequired() {
  return (
    <main className="portal-page mission-access-page">
      <section className="mission-access-panel">
        <span className="mission-access-icon"><LockKeyhole size={28} /></span>
        <span className="portal-eyebrow"><Map size={15} /> Laluan terkunci</span>
        <h1>Selesaikan misi sebelumnya dahulu.</h1>
        <p>Kembali ke peta kembara untuk melihat langkah yang perlu dibuat seterusnya.</p>
        <a className="mission-access-link" href="/murid/ruang"><ArrowLeft size={17} /> Kembali ke peta</a>
      </section>
    </main>
  );
}
