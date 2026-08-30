import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import BahasaMelayuHub from "../bm/BahasaMelayuHub.jsx";
import MathHub from "../math/MathHub.jsx";
import SubjectPicker from "./SubjectPicker.jsx";

export default function HomeLanding() {
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
          <span className="brand-tile brand-tile-a">A</span>
          <span className="brand-tile brand-tile-one">1</span>
          <span className="brand-tile brand-tile-star"><Star size={13} fill="currentColor" /></span>
          <span className="brand-name">Bijak <em>belajar</em></span>
        </button>
        <div className="home-topbar-note"><span className="status-dot" /> Jom mula!</div>
      </header>

      {subject === "bm" && <BahasaMelayuHub onBack={() => chooseSubject(null)} onComingSoon={showComingSoon} notice={notice} />}
      {subject === "math" && <MathHub onBack={() => chooseSubject(null)} onComingSoon={showComingSoon} notice={notice} />}
      {!subject && <SubjectPicker onChooseSubject={chooseSubject} />}

      <footer className="home-footer"><span>Bahasa Melayu + Matematik</span><span>Untuk belajar bersama-sama</span></footer>
    </main>
  );
}
