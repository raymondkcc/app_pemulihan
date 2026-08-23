function SubjectPicker({ onChooseSubject }) {
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

function HomeLanding() {
  const [subject, setSubject] = useState(null);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  function chooseSubject(nextSubject) {
    setSubject(nextSubject);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showComingSoon(label) {
    setNotice(`${label} akan datang. Kita simpan ruang ini untuk permainan seterusnya!`);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 4200);
  }

  return (
    <main className="home-page">
      <div className="home-grid-lines" aria-hidden="true" />
      <header className="home-topbar">
        <button className="home-brand" type="button" onClick={() => chooseSubject(null)} aria-label="Kembali ke pilih subjek">
          <span className="brand-tile brand-tile-a">A</span><span className="brand-tile brand-tile-one">1</span><span className="brand-tile brand-tile-star"><Star size={13} fill="currentColor" /></span>
          <span className="brand-name">Bijak <em>belajar</em></span>
        </button>
        <div className="home-topbar-note"><span className="status-dot" /> Jom mula!</div>
      </header>

      {subject === "bm" && <BahasaMelayuHub onBack={() => chooseSubject(null)} onComingSoon={showComingSoon} notice={notice} />}
      {subject === "math" && <MathematicsHub onBack={() => chooseSubject(null)} onComingSoon={showComingSoon} notice={notice} />}
      {!subject && <SubjectPicker onChooseSubject={chooseSubject} />}

      <footer className="home-footer"><span>Bahasa Melayu + Matematik</span><span>Untuk belajar bersama-sama</span></footer>
    </main>
  );
}

function HomePlaceholder() {
  return null;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
