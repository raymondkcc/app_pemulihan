function MathematicsHub({ onBack, onComingSoon, notice }) {
  return (
    <div className="home-content hub-content math-hub-content">
      <div className="hub-hero math-hero">
        <button className="back-button" type="button" onClick={onBack} title="Kembali pilih subjek">
          <ArrowLeft size={18} /> <span>Subjek</span>
        </button>
        <div className="hub-title-block">
          <span className="hub-eyebrow"><Calculator size={15} /> Matematik <span>/ Mathematics</span></span>
          <h1>Kira, cuba, tepuk tangan!</h1>
          <p>Choose an operation and make numbers your playground.</p>
        </div>
        <div className="math-hero-equation" aria-hidden="true"><span>3</span><b>+</b><span>2</span><b>=</b><strong>5</strong></div>
      </div>

      <section className="hub-section operation-section" aria-labelledby="operation-title">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">01 / Nombor</span>
            <h2 id="operation-title">Pilih operasi</h2>
            <p>Pick a maths move to practise next.</p>
          </div>
          <span className="skill-count"><Calculator size={15} /> 4 ruang latihan</span>
        </div>
        <div className="operation-grid">
          {MATH_OPERATIONS.map(({ id, title, english, symbol, helper, color, Icon, href }) => {
            const content = (
              <>
                <span className="operation-card-icon"><Icon size={23} strokeWidth={2.8} /></span>
                <span className="operation-symbol" aria-hidden="true">{symbol}</span>
                <span className="operation-copy"><strong>{title}</strong><span>{english}</span><em>{helper}</em></span>
                <span className="operation-status">{href ? <>Buka latihan <ArrowRight size={14} /></> : <>Akan datang <LockKeyhole size={14} /></>}</span>
              </>
            );

            return href
              ? <a className={`operation-card operation-card-${color} is-live`} href={href} key={id} aria-label={`Buka ${title}`}>{content}</a>
              : <button className={`operation-card operation-card-${color}`} type="button" key={id} onClick={() => onComingSoon(title)}>{content}</button>;
          })}
        </div>
      </section>

      <section className="math-practice-strip" aria-label="Contoh ruang matematik">
        <div className="math-strip-icon"><Calculator size={26} /></div>
        <div><span className="section-kicker">Ruang kira-kira</span><strong>Setiap jawapan betul jadi satu bintang.</strong></div>
        <div className="star-row" aria-hidden="true"><Star size={22} fill="currentColor" /><Star size={22} fill="currentColor" /><Star size={22} fill="currentColor" /><Star size={22} /></div>
      </section>

      <section className="math-game-strip" aria-label="Permainan matematik">
        <span className="math-game-icon"><Sparkles size={26} /></span>
        <div className="math-game-copy">
          <span className="section-kicker">Permainan laju</span>
          <strong>Hempaplah Nyamuk!</strong>
          <em>Tambah, tolak dan darab dalam 60 saat.</em>
        </div>
        <a className="math-game-link" href="/mosquito-splat">Main <ArrowRight size={15} /></a>
      </section>
      {notice && <div className="home-notice" role="status"><Sparkles size={17} /> <span>{notice}</span></div>}
    </div>
  );
}

function SubjectPicker({ onChooseSubject }) {
  return (
    <div className="home-content picker-content">
