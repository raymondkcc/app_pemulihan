import { Sparkles, Star, Trophy } from "lucide-react";
import SubjectCard from "./SubjectCard.jsx";

export default function SubjectPicker({ onChooseSubject }) {
  return (
    <div className="home-content picker-content">
      <div className="picker-copy">
        <span className="home-eyebrow"><Sparkles size={15} /> Ruang belajar / learning space</span>
        <h1>Saya nak belajar <span>I want to learn</span></h1>
        <p>Pilih satu subjek untuk mulakan misi kecil hari ini.</p>
      </div>
      <div className="subject-grid">
        <SubjectCard title="Bahasa Melayu" english="Malay" description="Baca bunyi, bina perkataan, padan gambar." type="book" color="coral" onClick={() => onChooseSubject("bm")} />
        <SubjectCard title="Matematik" english="Mathematics" description="Kira nombor dengan tambah, tolak, darab, bahagi." type="math" color="blue" onClick={() => onChooseSubject("math")} />
      </div>
      <div className="picker-footer">
        <span><Star size={16} fill="currentColor" /> Belajar sedikit demi sedikit</span>
        <span>Small steps, big wins <Trophy size={16} /></span>
      </div>
    </div>
  );
}
