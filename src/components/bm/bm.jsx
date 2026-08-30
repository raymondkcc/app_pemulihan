function BahasaMelayuHub({ onBack, onComingSoon, notice }) {
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);

  function selectCategory(catId) {
    setCategory(catId);
    setSubCategory(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function selectSubCategory(subId) {
    setSubCategory(subId);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBack() {
    if (subCategory) {
      setSubCategory(null);
    } else if (category) {
      setCategory(null);
    } else {
      onBack();
    }
  }

  // Render sub-category content based on category + subCategory
  if (category && subCategory) {
    // HURUF category
    if (category === "huruf") {
      if (subCategory === "belajar") return <HurufModule onBack={goBack} />;
      if (subCategory === "main") return (
        <div className="home-content hub-content">
          <div className="hub-hero">
            <button className="back-button" type="button" onClick={goBack}><ArrowLeft size={18} /> <span>Huruf</span></button>
            <div className="hub-title-block">
              <h1>Main Huruf</h1>
              <p>Permainan huruf besar dan kecil</p>
            </div>
          </div>
          <Suspense fallback={<div>Menyediakan...</div>}>
            <LetterCaseGame letters={HURUF} onPlayLetter={playLetterAudio} />
          </Suspense>
        </div>
      );
      if (subCategory === "ujian") return (
        <div className="home-content hub-content">
          <div className="hub-hero">
            <button className="back-button" type="button" onClick={goBack}><ArrowLeft size={18} /> <span>Huruf</span></button>
            <div className="hub-title-block">
              <h1>Ujian Huruf</h1>
              <p>Uji diri anda</p>
            </div>
          </div>
          <p className="home-notice">Ujian huruf akan datang.</p>
        </div>
      );
    }
    // VOKAL category
    if (category === "vokal") {
      if (subCategory === "belajar") return <VokalModule onBack={goBack} />;
      if (subCategory === "main") return (
        <div className="home-content hub-content">
          <div className="hub-hero">
            <button className="back-button" type="button" onClick={goBack}><ArrowLeft size={18} /> <span>Vokal</span></button>
            <div className="hub-title-block">
              <h1>Main Vokal</h1>
              <p>Permainan bunyi haiwan</p>
            </div>
          </div>
          <ScreamAnimalCard />
        </div>
      );
      if (subCategory === "ujian") return (
        <div className="home-content hub-content">
          <div className="hub-hero">
            <button className="back-button" type="button" onClick={goBack}><ArrowLeft size={18} /> <span>Vokal</span></button>
            <div className="hub-title-block">
              <h1>Ujian Vokal</h1>
              <p>Uji sebutan vokal</p>
            </div>
          </div>
          <p className="home-notice">Ujian vokal akan datang.</p>
        </div>
      );
    }
    // SUKU KATA category (KV moved here)
    if (category === "suku-kata") {
      if (subCategory === "belajar") return <KVModule onBack={goBack} />;
      if (subCategory === "main") {
        window.location.href = "/kv-sound-pond";
        return null;
      }
      if (subCategory === "ujian") return <KVKGame onBack={goBack} />;
    }
    // PERKATAAN category
    if (category === "perkataan") {
      if (subCategory === "belajar") return <PerkataanModule onBack={goBack} />;
      if (subCategory === "main") return <PerkataanQuizGame onBack={goBack} />;
      if (subCategory === "ujian") return <PerkataanFlashCardGame onBack={goBack} />;
    }
  }

  // Render category selection (show 4 main categories)
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
      </div>
    );
  }

  // Render main category picker (4 categories)
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
        {BM_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`bm-category-card bm-category-${cat.color}`}
            type="button"
            onClick={() => selectCategory(cat.id)}
          >
            <span className="bm-category-title">{cat.title}</span>
            <span className="bm-category-subtitle">{cat.subtitle}</span>
            <span className="bm-category-desc">{cat.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

