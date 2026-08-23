function PerkataanModule({ onBack }) {
  const totalItems = PERKATAAN_SKILLS.reduce((total, skill) => total + perkataanItemCount(skill), 0);

  return (
    <div className="home-content hub-content perkataan-module-content">
      <div className="hub-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih kategori Perkataan">
          <ArrowLeft size={18} /> <span>Perkataan</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Image size={15} /> Perkataan <span>/ Words</span></span>
          <h1>Dengar dan kenal perkataan</h1>
          <p>Ikut kemahiran dari KVKV hingga digraf. Tekan perkataan untuk dengar sebutannya.</p>
        </div>
        <div className="hub-hero-badge"><BookOpen size={18} /><span><strong>{PERKATAAN_SKILLS.length}</strong> kemahiran · {totalItems} perkataan</span></div>
      </div>

      {PERKATAAN_SKILLS.map((skill) => <PerkataanSkillSection key={skill.id} skill={skill} />)}
    </div>
  );
}

function BahasaMelayuHub({ onBack, onComingSoon, notice }) {
