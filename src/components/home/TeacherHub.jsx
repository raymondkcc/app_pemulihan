import { ArrowRight, BookOpen, Calculator, ChevronLeft, GraduationCap, LockKeyhole, Play, Presentation, Target } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingScreen from "../kembara/LoadingScreen.jsx";
import { getActiveAdult, whenAuthReady } from "../../utils/kembaraStore.js";

const SUBJECTS = {
  bm: {
    title: "Bahasa Melayu",
    english: "Malay",
    Icon: BookOpen,
    items: [
      { id: "bm-huruf", title: "Huruf", text: "Kenal huruf besar dan kecil", href: "/murid/bahasa-melayu" },
      { id: "bm-vokal", title: "Vokal", text: "Dengar dan kenal bunyi vokal", href: "/murid/bahasa-melayu" },
      { id: "bm-suku-kata", title: "Suku kata", text: "Latihan KV dan KVK", href: "/kvk" },
      { id: "bm-perkataan", title: "Perkataan", text: "Bina dan kenal perkataan", href: "/murid/bahasa-melayu" },
      { id: "bm-sebutan", title: "Sebutan", text: "Dengar dan sebut", href: "/murid/bahasa-melayu" }
    ]
  },
  math: {
    title: "Matematik",
    english: "Mathematics",
    Icon: Calculator,
    items: [
      { id: "math-tambah", title: "Tambah", text: "Bina dan kumpul nombor", href: "/addition-regroup" },
      { id: "math-tolak", title: "Tolak", text: "Ambil dan kira", href: "/minus-regroup" },
      { id: "math-darab", title: "Darab", text: "Kumpulan sama banyak", href: "/mosquito-splat?op=darab" },
      { id: "math-bahagi", title: "Bahagi", text: "Kongsi sama rata", href: null }
    ]
  }
};

function AuthenticatedTeacherPage({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await whenAuthReady();
      if (!getActiveAdult()) {
        window.location.replace("/cikgu");
        return;
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready) return <LoadingScreen variant="teacher" />;
  return children;
}

function TeacherHeader({ children }) {
  return (
    <header className="teacher-header">
      <a href="/akaun" className="portal-back" aria-label="Kembali / Back"><ChevronLeft size={20} /></a>
      <div className="portal-logo"><span>A</span><span>1</span><span>*</span></div>
      <div><span className="portal-kicker">Ruang cikgu / Teacher space</span><strong>{children}</strong></div>
      <span className="teacher-badge"><GraduationCap size={16} /> Teacher / Parent</span>
    </header>
  );
}

function SubjectTabs({ subject, onChange }) {
  return (
    <div className="teacher-subject-tabs" role="tablist" aria-label="Pilih subjek / Choose subject">
      {Object.entries(SUBJECTS).map(([id, item]) => {
        const SubjectIcon = item.Icon;
        return <button key={id} className={subject === id ? "is-active" : ""} type="button" role="tab" aria-selected={subject === id} onClick={() => onChange(id)}><SubjectIcon size={19} /> {item.title}<small>{item.english}</small></button>;
      })}
    </div>
  );
}

function ActivityList({ data, heading = "Aktiviti / Activities" }) {
  const Icon = data.Icon;
  return (
    <section className="teacher-activity-panel">
      <div className="section-heading-row"><div><span className="section-kicker">{heading}</span><h2><Icon size={22} /> {data.title}</h2></div></div>
      <div className="teacher-activity-list">{data.items.map((item, index) => <div className={`teacher-activity ${!item.href ? "is-locked" : ""}`} key={item.id}><span className="teacher-number">{String(index + 1).padStart(2, "0")}</span><span className="teacher-activity-copy"><strong>{item.title}</strong><span>{item.text}</span></span>{item.href ? <a href={item.href} aria-label={`Buka ${item.title}`}><Play size={16} fill="currentColor" /> Buka / Open <ArrowRight size={15} /></a> : <span className="teacher-coming"><LockKeyhole size={15} /> Akan datang / Coming soon</span>}</div>)}</div>
    </section>
  );
}

function GuideAside() {
  return <aside className="teacher-guide"><span className="section-kicker">Panduan ringkas / Quick guide</span><h2>Perhatikan langkah anak</h2><ul><li><strong>Latih</strong><span>Biarkan anak cuba dahulu.</span></li><li><strong>Tanya</strong><span>“Bunyi apa yang kamu dengar?”</span></li><li><strong>Raikan</strong><span>Puji usaha, bukan hanya jawapan betul.</span></li></ul><div className="teacher-tip"><Target size={17} /><span>Tip: Beri masa untuk anak berfikir sebelum membantu.</span></div></aside>;
}

function GuideHub({ initialSubject }) {
  const [subject, setSubject] = useState(initialSubject);
  const data = SUBJECTS[subject];

  return (
    <main className="teacher-page">
      <TeacherHeader>Panduan aktiviti</TeacherHeader>
      <section className="teacher-content">
        <div className="teacher-intro">
          <span className="portal-eyebrow"><Target size={16} /> Sedia untuk belajar bersama?</span>
          <h1>Pilih aktiviti untuk anak</h1>
          <p>Choose an activity, then explore it together with your learner.</p>
        </div>
        <SubjectTabs subject={subject} onChange={setSubject} />
        <div className="teacher-layout"><ActivityList data={data} /><GuideAside /></div>
      </section>
    </main>
  );
}

function TeachingMode() {
  const [subject, setSubject] = useState("bm");
  const data = SUBJECTS[subject];

  return (
    <main className="teacher-page teaching-mode-page">
      <TeacherHeader>Mod pengajaran</TeacherHeader>
      <section className="teacher-content">
        <div className="teacher-intro">
          <span className="portal-eyebrow"><Presentation size={16} /> Teaching mode / Mod mengajar</span>
          <h1>Pilih cara mengajar hari ini</h1>
          <p>Pilih subjek, kemudian buka aktiviti yang mahu digunakan bersama murid. Anda boleh kembali dan bertukar subjek pada bila-bila masa.</p>
        </div>
        <SubjectTabs subject={subject} onChange={setSubject} />
        <div className="teacher-layout"><ActivityList data={data} heading="Mod pembelajaran / Learning modes" /><GuideAside /></div>
      </section>
    </main>
  );
}

export default function TeacherHub({ initialSubject = "bm", teachingMode = false }) {
  return <AuthenticatedTeacherPage>{teachingMode ? <TeachingMode /> : <GuideHub initialSubject={initialSubject} />}</AuthenticatedTeacherPage>;
}
