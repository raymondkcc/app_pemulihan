import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, PenLine, Sparkles, Volume2 } from "lucide-react";
import { BM_CATEGORIES } from "../../data/bm.js";
import { getActiveStudent } from "../../utils/kembaraStore.js";
import HurufModule from "./HurufModule.jsx";
import VokalModule from "./VokalModule.jsx";
import KVModule from "./KVModule.jsx";
import KVKLearning from "./KVKLearning.jsx";
import PerkataanModule from "./PerkataanModule.jsx";
import PerkataanFlashCardGame from "./PerkataanFlashCardGame.jsx";
import PerkataanQuizGame from "./PerkataanQuizGame.jsx";
import SpeechSyllableQuiz from "./SpeechSyllableQuiz.jsx";
import SyllableLearningChoice from "./SyllableLearningChoice.jsx";
import LetterLearningChoice from "./LetterLearningChoice.jsx";
import BMAssessment from "./BMAssessment.jsx";
import HurufGames from "../../games/huruf/HurufGames.jsx";

function ScreamAnimalCard() {
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  function handleClick() {
    if (playing) return;
    setPlaying(true);
    setPlayCount((count) => count + 1);
    const audio = new window.Audio("/audio/vowels/scream-a.mp3");
    audio.addEventListener("ended", () => setPlaying(false), { once: true });
    audio.addEventListener("error", () => setPlaying(false), { once: true });
    audio.play().catch(() => setPlaying(false));
  }

  return (
    <section className="scream-section" aria-labelledby="scream-title">
      <div className="section-heading-row">
        <div><span className="section-kicker">Aktiviti seronok</span><h2 id="scream-title">A untuk Ayam!</h2><p>Tekan ayam untuk dengar bunyi aaaaahh.</p></div>
        <span className="skill-count"><Volume2 size={15} /> Jerit aaaaahh</span>
      </div>
      <button className={`scream-animal-card ${playing ? "is-playing" : ""}`} type="button" onClick={handleClick} disabled={playing} aria-label="Tekan gambar ayam untuk mainkan bunyi aaaaahh">
        <span className="scream-animal-frame">
          <img key={playCount} className="scream-animal-image" src={playing ? "/images/vowels/ayam-scream.gif" : "/images/vowels/ayam-scream-poster.png"} alt="" draggable="false" />
          {!playing && <span className="scream-play-badge" aria-hidden="true"><Volume2 size={22} fill="currentColor" /></span>}
        </span>
        <span className="scream-caption">{playing ? "Aaaaahh!" : "Tekan untuk jerit aaaaahh!"}</span>
      </button>
    </section>
  );
}

function ComingSoon({ onBack, title, description }) {
  return (
    <div className="home-content hub-content">
      <div className="hub-hero"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Kembali</span></button><div className="hub-title-block"><span className="hub-eyebrow"><Sparkles size={15} /> Akan datang</span><h1>{title}</h1><p>{description}</p></div></div>
      <p className="home-notice" role="status">Aktiviti ini akan datang.</p>
    </div>
  );
}

function MainVokal({ onBack }) {
  return <div className="home-content hub-content"><div className="hub-hero"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Vokal</span></button><div className="hub-title-block"><span className="hub-eyebrow"><Volume2 size={15} /> Vokal</span><h1>Main Vokal</h1><p>Permainan bunyi haiwan</p></div></div><ScreamAnimalCard /></div>;
}

function MainHuruf({ onBack, onMissionComplete }) {
  return <div className="home-content hub-content"><div className="hub-hero"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Huruf</span></button><div className="hub-title-block"><span className="hub-eyebrow"><PenLine size={15} /> Huruf</span><h1>Main Huruf</h1><p>Dengar bunyi dan padankan huruf dengan keluarga haiwan.</p></div></div><HurufGames onBack={onBack} onComplete={onMissionComplete} /></div>;
}

function CategoryHeader({ onBack, cat }) {
  return <div className="hub-hero"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Bahasa Melayu</span></button><div className="hub-title-block"><span className="hub-eyebrow"><BookOpen size={15} /> Bahasa Melayu</span><h1>{cat.title}</h1><p>{cat.description}</p></div></div>;
}

export default function BahasaMelayuHub({ onBack, onComingSoon, notice, initialMission, onMissionComplete }) {
  const startsHurufMission = initialMission === "huruf";
  const startsSyllableMission = initialMission === "suku-kata";
  const [category, setCategory] = useState(startsHurufMission ? "huruf" : startsSyllableMission ? "suku-kata" : null);
  const [subCategory, setSubCategory] = useState(startsSyllableMission ? "main" : null);
  const [learningChoiceOpen, setLearningChoiceOpen] = useState(false);
  const student = getActiveStudent();
  const guestDemo = Boolean(student?.isGuest);
  const missionLockedToHuruf = startsHurufMission;

  function selectCategory(catId) {
    if (missionLockedToHuruf && catId !== "huruf") return;
    if (guestDemo && catId !== "huruf") {
      window.location.href = "/murid/demo-tamat";
      return;
    }
    setCategory(catId);
    setSubCategory(null);
    setLearningChoiceOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function selectSubCategory(subId) {
    if (category === "huruf" && subId === "belajar") {
      setLearningChoiceOpen(true);
      return;
    }
    if (category === "suku-kata" && subId === "belajar") {
      setLearningChoiceOpen(true);
      return;
    }
    setSubCategory(subId);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBack() {
    if (subCategory) {
      setSubCategory(null);
    } else if (category) {
      if (missionLockedToHuruf) {
        onBack();
        return;
      }
      setCategory(null);
      setLearningChoiceOpen(false);
    } else {
      onBack();
    }
  }

  if (category && subCategory) {
    if (category === "huruf") {
      if (subCategory === "baca" || subCategory === "tulis") return <HurufModule mode={subCategory} onBack={goBack} />;
      if (subCategory === "main") return <MainHuruf onBack={goBack} onMissionComplete={onMissionComplete} />;
      if (subCategory === "ujian") return <BMAssessment type="huruf" onBack={goBack} />;
    }
    if (category === "vokal") {
      if (subCategory === "belajar") return <VokalModule onBack={goBack} />;
      if (subCategory === "main") return <MainVokal onBack={goBack} />;
      if (subCategory === "ujian") return <BMAssessment type="vokal" onBack={goBack} />;
    }
    if (category === "suku-kata") {
      if (subCategory === "kv") return <KVModule onBack={goBack} />;
      if (subCategory === "kvk") return <KVKLearning onBack={goBack} />;
      if (subCategory === "main") return <div className="home-content hub-content"><CategoryHeader onBack={goBack} cat={BM_CATEGORIES.find((item) => item.id === category)} /><a className="kv-pond-launch" href={initialMission === "suku-kata" ? "/kv-sound-pond?mission=suku-kata" : "/kv-sound-pond"}><span><strong>Lompat Si Katak Lompat</strong><p>Dengar bunyi KV, kemudian pilih gema yang sama.</p></span><span>Main sekarang <ArrowLeft size={17} /></span></a></div>;
      if (subCategory === "ujian") return <SpeechSyllableQuiz onBack={goBack} />;
    }
    if (category === "perkataan") {
      if (subCategory === "belajar") return <PerkataanModule onBack={goBack} />;
      if (subCategory === "main") return <PerkataanQuizGame onBack={goBack} />;
      if (subCategory === "ujian") return <PerkataanFlashCardGame onBack={goBack} />;
    }
  }

  if (category) {
    const cat = BM_CATEGORIES.find(c => c.id === category);
    if (!cat) return null;
    return (
      <div className="home-content hub-content">
        <div className="hub-hero">
          <button className="back-button" type="button" onClick={goBack}><ArrowLeft size={18} /> <span>Bahasa Melayu</span></button>
          <div className="hub-title-block">
            <h1>{cat.title}</h1>
            <p>{cat.description}</p>
          </div>
        </div>
        <div className="category-sub-grid">
          {cat.subCategories.map(sub => (
            <button
              key={sub.id}
              className={`category-sub-card category-sub-${sub.id}`}
              type="button"
              onClick={() => selectSubCategory(sub.id)}
            >
              <strong>{sub.title}</strong>
              <span>{sub.description}</span>
            </button>
          ))}
        </div>
        {category === "huruf" && learningChoiceOpen && <LetterLearningChoice onBack={() => setLearningChoiceOpen(false)} onChoose={(choice) => { setLearningChoiceOpen(false); setSubCategory(choice); window.scrollTo({ top: 0, behavior: "auto" }); }} />}
        {category === "suku-kata" && learningChoiceOpen && <SyllableLearningChoice onBack={() => setLearningChoiceOpen(false)} onChoose={(choice) => { setLearningChoiceOpen(false); setSubCategory(choice); window.scrollTo({ top: 0, behavior: "auto" }); }} />}
      </div>
    );
  }

  return (
    <div className="home-content hub-content">
      <div className="hub-hero">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> <span>Subjek</span></button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><BookOpen size={15} /> Bahasa Melayu</span>
          <h1>Pilih tajuk</h1>
          <p>Pilih satu kategori untuk mula belajar.</p>
        </div>
      </div>
      <div className="bm-categories-grid">
        {(missionLockedToHuruf || guestDemo ? BM_CATEGORIES.filter((item) => item.id === "huruf") : BM_CATEGORIES).map(cat => (
          <button
            key={cat.id}
            className={`bm-category-card bm-category-${cat.color}`}
            type="button"
            onClick={() => selectCategory(cat.id)}
          >
            <img className="bm-category-image" src={cat.image} alt="" onError={(event) => { event.currentTarget.hidden = true; }} />
            <span className="bm-category-copy"><span className="bm-category-title">{cat.title}</span><span className="bm-category-subtitle">{cat.subtitle}</span></span>
            <span className="bm-category-action" aria-hidden="true"><ArrowRight size={22} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
