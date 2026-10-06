import { ArrowLeft, ArrowRight, BookOpen, Bug, Calculator, ChevronLeft, Gamepad2, GraduationCap, LockKeyhole, Play, Presentation, Shield, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingScreen from "../kembara/LoadingScreen.jsx";
import AdventureLogo from "./AdventureLogo.jsx";
import { getActiveAdult, whenAuthReady } from "../../utils/kembaraStore.js";
import { activityHref } from "../../utils/activityNavigation.js";

const SUBJECTS = {
  bm: {
    title: "Bahasa Melayu",
    english: "Malay",
    Icon: BookOpen,
    items: [
      { id: "bm-huruf", title: "Huruf", text: "Kenal huruf besar dan kecil", href: "/murid/bahasa-melayu?category=huruf" },
      { id: "bm-vokal", title: "Vokal", text: "Dengar dan kenal bunyi vokal", href: "/murid/bahasa-melayu?category=vokal" },
      { id: "bm-suku-kata", title: "Suku kata", text: "Latihan KV dan KVK", href: "/murid/bahasa-melayu?category=suku-kata" },
      { id: "bm-perkataan", title: "Perkataan", text: "Bina dan kenal perkataan", href: "/murid/bahasa-melayu?category=perkataan" },
      { id: "bm-sebutan", title: "Sebutan", text: "Dengar dan sebut", href: "/murid/bahasa-melayu?category=suku-kata&activity=ujian" }
    ]
  },
  math: {
    title: "Matematik",
    english: "Mathematics",
    Icon: Calculator,
    items: [
      { id: "math-tambah", title: "Tambah", text: "Zombie Defense untuk tambah", teacherText: "Pilih Belajar atau Bermain", operation: "tambah", symbol: "+", learningHref: "/addition-regroup", href: "/zombie-defense?op=tambah&mode=teacher" },
      { id: "math-tolak", title: "Tolak", text: "Zombie Defense untuk tolak", teacherText: "Pilih Belajar atau Bermain", operation: "tolak", symbol: "−", learningHref: "/minus-regroup", href: "/zombie-defense?op=tolak&mode=teacher" },
      { id: "math-darab", title: "Darab", text: "Zombie Defense untuk darab", teacherText: "Pilih Belajar atau Bermain", operation: "darab", symbol: "×", href: "/zombie-defense?op=darab&mode=teacher" },
      { id: "math-bahagi", title: "Bahagi", text: "Zombie Defense untuk bahagi", teacherText: "Pilih Belajar atau Bermain", operation: "bahagi", symbol: "÷", href: "/zombie-defense?op=bahagi&mode=teacher" }
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
      <AdventureLogo />
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

function ActivityList({ data, heading = "Aktiviti / Activities", onActivitySelect }) {
  const Icon = data.Icon;
  return (
    <section className="teacher-activity-panel">
      <div className="section-heading-row"><div><span className="section-kicker">{heading}</span><h2><Icon size={22} /> {data.title}</h2></div></div>
      <div className="teacher-activity-list">{data.items.map((item, index) => {
        const href = item.href ? activityHref(item.href, { teacherMode: true, returnTo: window.location.pathname }) : null;
        const action = item.href && onActivitySelect && item.operation
          ? <button type="button" onClick={() => onActivitySelect(item)} aria-label={`Pilih cara untuk ${item.title}`}><Play size={16} fill="currentColor" /> Buka / Open <ArrowRight size={15} /></button>
          : item.href
            ? <a href={href} aria-label={`Buka ${item.title}`}><Play size={16} fill="currentColor" /> Buka / Open <ArrowRight size={15} /></a>
            : <span className="teacher-coming"><LockKeyhole size={15} /> Akan datang / Coming soon</span>;
        const description = onActivitySelect && item.teacherText ? item.teacherText : item.text;
        return <div className={`teacher-activity ${!item.href ? "is-locked" : ""}`} key={item.id}><span className="teacher-number">{String(index + 1).padStart(2, "0")}</span><span className="teacher-activity-copy"><strong>{item.title}</strong><span>{description}</span></span>{action}</div>;
      })}</div>
    </section>
  );
}

function MathOperationChoice({ operation, onClose }) {
  const [choiceStep, setChoiceStep] = useState("mode");

  useEffect(() => {
    const handleEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const openLearning = () => {
    if (operation.learningHref) window.location.href = activityHref(operation.learningHref, { teacherMode: true, returnTo: window.location.pathname });
  };
  const openGame = (game) => {
    window.location.href = activityHref(game === "zombie"
      ? `/zombie-defense?op=${operation.operation}`
      : `/mosquito-splat?op=${operation.operation}&game=mosquito`, { teacherMode: true, returnTo: window.location.pathname });
  };

  return (
    <div className="syllable-choice-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="syllable-choice-dialog math-game-choice-dialog" role="dialog" aria-modal="true" aria-labelledby={choiceStep === "mode" ? "teacher-math-mode-choice-title" : "teacher-math-game-choice-title"}>
        <button className="icon-close-button" type="button" onClick={onClose} aria-label="Tutup pilihan permainan"><X size={18} /></button>
        <span className="section-kicker">{operation.symbol} Operasi {operation.title}</span>
        {choiceStep === "mode" ? (
          <>
            <h2 id="teacher-math-mode-choice-title">Pilih Belajar atau Bermain</h2>
            <p>Pilih cara untuk mengajar operasi ini.</p>
            <div className="math-game-choice-grid math-mode-choice-grid">
              <button type="button" className="math-game-choice math-game-choice-learn" onClick={openLearning} disabled={!operation.learningHref}><span><BookOpen size={25} /></span><strong>Belajar</strong><small>{operation.learningHref ? "Latihan langkah demi langkah." : "Modul belajar untuk operasi ini akan datang."}</small>{operation.learningHref ? <ArrowRight size={17} /> : <span className="math-choice-badge">Akan datang</span>}</button>
              <button type="button" className="math-game-choice math-game-choice-play" onClick={() => setChoiceStep("games")}><span><Gamepad2 size={25} /></span><strong>Bermain</strong><small>Pilih Hempaplah Nyamuk atau Zombie Defense.</small><ArrowRight size={17} /></button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="math-choice-back" onClick={() => setChoiceStep("mode")}><ArrowLeft size={16} /> Belajar atau Bermain</button>
            <h2 id="teacher-math-game-choice-title">Pilih permainan</h2>
            <p>Pilih permainan untuk operasi ini.</p>
            <div className="math-game-choice-grid">
              <button type="button" className="math-game-choice math-game-choice-mosquito" onClick={() => openGame("mosquito")}><span><Bug size={25} /></span><strong>Hempaplah Nyamuk</strong><small>Kira dan hempap jawapan yang betul.</small><ArrowRight size={17} /></button>
              <button type="button" className="math-game-choice math-game-choice-zombie" onClick={() => openGame("zombie")}><span><Shield size={25} /></span><strong>Zombie Defense</strong><small>Serang zombie sambil lindungi otak.</small><ArrowRight size={17} /></button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function GuideAside() {
  return <aside className="teacher-guide"><span className="section-kicker">Panduan ringkas / Quick guide</span><h2>Perhatikan langkah anak</h2><ul><li><strong>Latih</strong><span>Biarkan anak cuba dahulu.</span></li><li><strong>Tanya</strong><span>“Bunyi apa yang kamu dengar?”</span></li><li><strong>Raikan</strong><span>Puji usaha, bukan hanya jawapan betul.</span></li></ul><div className="teacher-tip"><Target size={17} /><span>Tip: Beri masa untuk anak berfikir sebelum membantu.</span></div></aside>;
}

function GuideHub({ initialSubject }) {
  const [subject, setSubject] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("subject");
    return Object.hasOwn(SUBJECTS, requested) ? requested : initialSubject;
  });
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
        <SubjectTabs subject={subject} onChange={(nextSubject) => { setSubject(nextSubject); window.history.replaceState(null, "", `${window.location.pathname}?subject=${nextSubject}`); }} />
        <div className="teacher-layout"><ActivityList data={data} /><GuideAside /></div>
      </section>
    </main>
  );
}

function TeachingMode() {
  const [subject, setSubject] = useState(new URLSearchParams(window.location.search).get("subject") === "math" ? "math" : "bm");
  const [selectedMathOperation, setSelectedMathOperation] = useState(null);
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
        <SubjectTabs subject={subject} onChange={(nextSubject) => { setSubject(nextSubject); window.history.replaceState(null, "", `/cikgu/mengajar?subject=${nextSubject}`); }} />
        <div className="teacher-layout"><ActivityList data={data} heading="Mod pembelajaran / Learning modes" onActivitySelect={subject === "math" ? setSelectedMathOperation : undefined} /><GuideAside /></div>
      </section>
      {selectedMathOperation && <MathOperationChoice operation={selectedMathOperation} onClose={() => setSelectedMathOperation(null)} />}
    </main>
  );
}

export default function TeacherHub({ initialSubject = "bm", teachingMode = false }) {
  return <AuthenticatedTeacherPage>{teachingMode ? <TeachingMode /> : <GuideHub initialSubject={initialSubject} />}</AuthenticatedTeacherPage>;
}
