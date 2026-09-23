import { ArrowRight, BookOpen, Calculator, Check, CheckCircle2, ChevronLeft, GraduationCap, Layers3, LockKeyhole, Play, Presentation, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getActiveAdult, whenAuthReady } from "../../utils/kembaraStore.js";

const TEACHING_SELECTION_KEY = "kembara-teaching-selection-v1";

const SUBJECTS = {
  bm: {
    title: "Bahasa Melayu",
    english: "Malay",
    Icon: BookOpen,
    tone: "coral",
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
    tone: "blue",
    items: [
      { id: "math-tambah", title: "Tambah", text: "Bina dan kumpul nombor", href: "/addition-regroup" },
      { id: "math-tolak", title: "Tolak", text: "Ambil dan kira", href: "/minus-regroup" },
      { id: "math-darab", title: "Darab", text: "Kumpulan sama banyak", href: "/mosquito-splat?op=darab" },
      { id: "math-bahagi", title: "Bahagi", text: "Kongsi sama rata", href: null }
    ]
  }
};

const ALL_MODES = Object.values(SUBJECTS).flatMap((subject) => subject.items);
const ALL_MODE_IDS = ALL_MODES.map((item) => item.id);

function readTeachingSelection() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(TEACHING_SELECTION_KEY) || "null");
    const valid = Array.isArray(stored) ? stored.filter((id) => ALL_MODE_IDS.includes(id)) : [];
    return Array.isArray(stored) ? valid : ALL_MODE_IDS;
  } catch {
    return ALL_MODE_IDS;
  }
}

function writeTeachingSelection(selection) {
  try { window.localStorage.setItem(TEACHING_SELECTION_KEY, JSON.stringify(selection)); } catch { /* private browsing */ }
}

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

  if (!ready) {
    return <main className="teacher-page"><section className="teacher-content"><p className="portal-note">Menyambung Firebase...</p></section></main>;
  }

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

function GuideHub({ initialSubject }) {
  const [subject, setSubject] = useState(initialSubject);
  const data = SUBJECTS[subject];
  const Icon = data.Icon;

  return (
    <main className="teacher-page">
      <TeacherHeader>Panduan aktiviti</TeacherHeader>
      <section className="teacher-content">
        <div className="teacher-intro">
          <span className="portal-eyebrow"><Target size={16} /> Sedia untuk belajar bersama?</span>
          <h1>Pilih aktiviti untuk anak</h1>
          <p>Choose an activity, then explore it together with your learner.</p>
        </div>
        <div className="teacher-subject-tabs" role="tablist">
          {Object.entries(SUBJECTS).map(([id, item]) => {
            const SubjectIcon = item.Icon;
            return <button key={id} className={subject === id ? "is-active" : ""} type="button" role="tab" aria-selected={subject === id} onClick={() => setSubject(id)}><SubjectIcon size={19} /> {item.title}<small>{item.english}</small></button>;
          })}
        </div>
        <div className="teacher-layout">
          <section className="teacher-activity-panel">
            <div className="section-heading-row"><div><span className="section-kicker">Aktiviti / Activities</span><h2><Icon size={22} /> {data.title}</h2></div><span className="skill-count"><CheckCircle2 size={15} /> {data.items.length} pilihan</span></div>
            <div className="teacher-activity-list">{data.items.map((item, index) => <div className={`teacher-activity ${!item.href ? "is-locked" : ""}`} key={item.id}><span className="teacher-number">{String(index + 1).padStart(2, "0")}</span><span className="teacher-activity-copy"><strong>{item.title}</strong><span>{item.text}</span></span>{item.href ? <a href={item.href} aria-label={`Buka ${item.title}`}><Play size={16} fill="currentColor" /> Buka / Open <ArrowRight size={15} /></a> : <span className="teacher-coming"><LockKeyhole size={15} /> Akan datang / Coming soon</span>}</div>)}</div>
          </section>
          <aside className="teacher-guide"><span className="section-kicker">Panduan ringkas / Quick guide</span><h2>Perhatikan langkah anak</h2><ul><li><strong>Latih</strong><span>Biarkan anak cuba dahulu.</span></li><li><strong>Tanya</strong><span>“Bunyi apa yang kamu dengar?”</span></li><li><strong>Raikan</strong><span>Puji usaha, bukan hanya jawapan betul.</span></li></ul><div className="teacher-tip"><Target size={17} /><span>Tip: Beri masa untuk anak berfikir sebelum membantu.</span></div></aside>
        </div>
      </section>
    </main>
  );
}

function TeachingMode() {
  const [selectedModes, setSelectedModes] = useState(readTeachingSelection);
  const selectedSet = useMemo(() => new Set(selectedModes), [selectedModes]);
  const selectedSubjects = Object.entries(SUBJECTS).filter(([, subject]) => subject.items.some((item) => selectedSet.has(item.id))).length;

  function updateSelection(nextSelection) {
    setSelectedModes(nextSelection);
    writeTeachingSelection(nextSelection);
  }

  function toggleMode(modeId) {
    const next = selectedSet.has(modeId)
      ? selectedModes.filter((id) => id !== modeId)
      : [...selectedModes, modeId];
    updateSelection(next);
  }

  function toggleSubject(subjectId) {
    const ids = SUBJECTS[subjectId].items.map((item) => item.id);
    const shouldSelect = ids.some((id) => !selectedSet.has(id));
    const next = shouldSelect
      ? [...new Set([...selectedModes, ...ids])]
      : selectedModes.filter((id) => !ids.includes(id));
    updateSelection(next);
  }

  function selectAll() { updateSelection(ALL_MODE_IDS); }
  function clearAll() { updateSelection([]); }

  return (
    <main className="teacher-page teaching-mode-page">
      <TeacherHeader>Mod pengajaran</TeacherHeader>
      <section className="teacher-content">
        <div className="teaching-mode-hero">
          <div className="teacher-intro">
            <span className="portal-eyebrow"><Presentation size={16} /> Teaching mode / Mod mengajar</span>
            <h1>Bina ruang mengajar anda</h1>
            <p>Pilih semua subjek dan mod yang mahu digunakan bersama murid. Tiada had pilihan — gabungkan sebanyak mana yang sesuai untuk kelas anda.</p>
          </div>
          <div className="teaching-mode-count"><strong>{selectedModes.length}</strong><span>mod dipilih</span><small>{selectedSubjects} subjek · tanpa had</small></div>
        </div>

        <section className="teaching-selection-panel">
          <div className="section-heading-row"><div><span className="section-kicker">Pilihan mengajar / Teaching choices</span><h2><Layers3 size={22} /> Subjek & mod pembelajaran</h2></div><div className="teaching-selection-actions"><button type="button" onClick={selectAll}>Pilih semua</button><button type="button" onClick={clearAll}>Kosongkan</button></div></div>
          <p className="teaching-selection-note">Tanda satu atau banyak pilihan. Pilihan ini disimpan pada peranti ini untuk sesi seterusnya.</p>
          <div className="teaching-subject-grid">
            {Object.entries(SUBJECTS).map(([subjectId, subject]) => {
              const SubjectIcon = subject.Icon;
              const selectedSubjectCount = subject.items.filter((item) => selectedSet.has(item.id)).length;
              const subjectFullySelected = selectedSubjectCount === subject.items.length;
              return (
                <section className={`teaching-subject-card teaching-subject-${subject.tone}`} key={subjectId}>
                  <button className="teaching-subject-heading" type="button" onClick={() => toggleSubject(subjectId)} aria-pressed={subjectFullySelected}>
                    <span className="teaching-subject-icon"><SubjectIcon size={22} /></span>
                    <span><strong>{subject.title}</strong><small>{subject.english} · {selectedSubjectCount}/{subject.items.length} mod</small></span>
                    <span className={`teaching-check ${subjectFullySelected ? "is-selected" : ""}`} aria-hidden="true">{subjectFullySelected && <Check size={16} />}</span>
                  </button>
                  <div className="teaching-mode-list">
                    {subject.items.map((item) => {
                      const selected = selectedSet.has(item.id);
                      return (
                        <div className={`teaching-mode-row ${selected ? "is-selected" : ""}`} key={item.id}>
                          <button type="button" className="teaching-mode-toggle" onClick={() => toggleMode(item.id)} aria-pressed={selected}>
                            <span className="teaching-check" aria-hidden="true">{selected && <Check size={14} />}</span>
                            <span><strong>{item.title}</strong><small>{item.text}</small></span>
                          </button>
                          {item.href ? <a href={item.href} className="teaching-open-link">Buka <ArrowRight size={14} /></a> : <span className="teaching-locked"><LockKeyhole size={13} /> Akan datang</span>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function TeacherHub({ initialSubject = "bm", teachingMode = false }) {
  return <AuthenticatedTeacherPage>{teachingMode ? <TeachingMode /> : <GuideHub initialSubject={initialSubject} />}</AuthenticatedTeacherPage>;
}
