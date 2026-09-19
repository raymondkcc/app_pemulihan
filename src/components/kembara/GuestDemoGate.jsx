import { LockKeyhole } from "lucide-react";
import WhatsAppCta from "./WhatsAppCta.jsx";

export default function GuestDemoGate() {
  return (
    <main className="portal-page">
      <section className="profile-content guest-gate">
        <span className="portal-eyebrow"><LockKeyhole size={16} /> Demo tamat</span>
        <h1>Simpan kembara?</h1>
        <p>Minta akaun percuma. Demo hanya tahap 1. Save your journey? Ask for a free account.</p>
        <WhatsAppCta />
        <a className="new-profile-button" href="/murid">Cuba demo semula / Play demo again</a>
        <a className="text-link" href="/">Kembali ke laman utama</a>
      </section>
    </main>
  );
}
