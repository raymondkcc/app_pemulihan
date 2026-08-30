import { useState } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
import { VOKAL } from "../../data/bm.js";
import MalaySoundPanel from "./MalaySoundPanel.jsx";

export default function VokalModule({ onBack }) {
  const [selectedVowel, setSelectedVowel] = useState(VOKAL[0]);

  return (
    <div className="home-content hub-content sound-module-content">
      <div className="hub-hero sound-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali ke ruang Bahasa Melayu"><ArrowLeft size={18} /> <span>Bahasa Melayu</span></button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Volume2 size={15} /> Vokal <span>/ Vowels</span></span>
          <h1>Dengar bunyi vokal</h1>
          <p>Tekan a, e pepet, e taling, i, o atau u untuk dengar bunyi Bahasa Melayu.</p>
        </div>
        <div className="sound-hero-badge"><Volume2 size={18} /><span><strong>6</strong> bunyi sedia</span></div>
      </div>
      <section className="letter-learning-section" aria-labelledby="vowel-learning-title">
        <div className="section-heading-row">
          <div><span className="section-kicker">Aktiviti belajar / Learn</span><h2 id="vowel-learning-title">Vokal Bahasa Melayu</h2><p>Pilih satu vokal dan dengar bunyinya.</p></div>
          <span className="skill-count"><Volume2 size={15} /> Bunyi Melayu</span>
        </div>
        <div className="letter-learning-grid letter-learning-grid-single">
          <MalaySoundPanel items={VOKAL} selectedItem={selectedVowel} onSelect={setSelectedVowel} title="Kenal bunyi vokal" description="Tekan satu vokal untuk dengar bunyinya." />
        </div>
      </section>
    </div>
  );
}
