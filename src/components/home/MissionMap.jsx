import { ArrowRight, BookOpen, Check, Gift, LockKeyhole, Map, Sparkles } from "lucide-react";
import { getCollectiblesForMap } from "../../data/collectibles.js";
import { MAP_THEMES, DEFAULT_MAP_THEME, getMapTheme } from "../../data/mapThemes.js";
import { getMissionsForTrack, missionIconForState } from "../../data/missions.js";
import { getFoundCollectibles, hasCollectedMap } from "../../utils/collectibleProgress.js";
import { getMissionProgress, isMissionUnlocked, subscribeToMissionProgress } from "../../utils/missionProgress.js";
import CollectibleSprite from "./CollectibleSprite.jsx";
import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "kembara-pintar-map-theme-v1";

function readTheme(studentId) {
  if (typeof window === "undefined") return DEFAULT_MAP_THEME;
  try {
    const themes = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || "{}");
    return themes[studentId] || DEFAULT_MAP_THEME;
  } catch {
    return DEFAULT_MAP_THEME;
  }
}

function saveTheme(studentId, themeId) {
  try {
    const themes = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || "{}");
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ ...themes, [studentId]: themeId }));
  } catch {
    // The selected theme still stays active for this view when storage is blocked.
  }
}

function MissionNode({ mission, state, index, href, position }) {
  const Icon = state === "complete" ? Check : state === "locked" ? LockKeyhole : missionIconForState(state);
  const node = (
    <span className={`mission-map-landmark mission-map-landmark-${state}`}>
      <span className="mission-map-marker" aria-hidden="true">
        <span className="mission-map-marker-icon"><Icon size={17} strokeWidth={2.8} /></span>
        <span className="mission-map-marker-stem" />
      </span>
      <span className="mission-map-node-number">{String(index + 1).padStart(2, "0")}</span>
    </span>
  );

  return (
    <li className={`mission-map-stop mission-map-stop-${state}`} style={{ "--map-x": `${position[0]}%`, "--map-y": `${position[1]}%` }}>
      {index > 0 && <span className={`mission-map-trail mission-map-trail-${state}`} aria-hidden="true" />}
      {state === "locked" ? node : <a href={href} aria-label={`${mission.title}, ${state === "complete" ? "selesai" : "mula misi"}`}>{node}</a>}
      <span className="mission-map-stop-copy">
        <span className="mission-map-stop-kicker">{state === "complete" ? "Boleh ulang" : state === "locked" ? "Belum terbuka" : "Checkpoint seterusnya"}</span>
        <strong>{mission.title}</strong>
        <small>{mission.description}</small>
        {state !== "locked" && <span className="mission-map-start"><span>{state === "complete" ? "Main semula" : "Mula checkpoint"}</span><ArrowRight size={15} /></span>}
        {state === "locked" && <span className="mission-map-requirement">Selesaikan misi sebelumnya</span>}
      </span>
    </li>
  );
}

export default function MissionMap({ student }) {
  const [completedIds, setCompletedIds] = useState(() => getMissionProgress(student.id).completedIds);
  const [themeId, setThemeId] = useState(() => readTheme(student.id));
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [foundCollectibleIds, setFoundCollectibleIds] = useState(() => getFoundCollectibles(student.id, readTheme(student.id)));
  const missions = getMissionsForTrack(student.track);
  const isDemo = Boolean(student.isDemo);
  const availableMapCount = isDemo ? MAP_THEMES.length : Math.min(MAP_THEMES.length, missions.length);
  const availableThemes = MAP_THEMES.slice(0, availableMapCount);
  const theme = getMapTheme(themeId);
  const isGuest = Boolean(student.isGuest);
  const visibleMissions = isGuest && !isDemo ? missions.slice(0, 1) : missions;
  const visibleCompletedIds = isDemo ? missions.map((mission) => mission.id) : completedIds;

  useEffect(() => {
    setThemeId(readTheme(student.id));
    setCompletedIds(getMissionProgress(student.id).completedIds);
    return subscribeToMissionProgress((detail) => {
      if (!detail || detail.studentId === student.id) {
        setCompletedIds(getMissionProgress(student.id).completedIds);
      }
    });
  }, [student.id]);

  const completedCount = missions.filter((mission) => visibleCompletedIds.includes(mission.id)).length;
  const unlockedMapCount = isDemo
    ? MAP_THEMES.length
    : isGuest
    ? 1
    : availableThemes.reduce((count, mapTheme, index) => {
      if (index === 0 || count !== index || !hasCollectedMap(student.id, availableThemes[index - 1].id)) return count;
      return count + 1;
    }, 1);
  const selectedThemeIndex = MAP_THEMES.findIndex((mapTheme) => mapTheme.id === theme.id);
  const activeTheme = selectedThemeIndex >= 0 && selectedThemeIndex < unlockedMapCount
    ? theme
    : MAP_THEMES[Math.max(0, unlockedMapCount - 1)];
  const currentIndex = missions.findIndex((mission, index) => !visibleCompletedIds.includes(mission.id) && isMissionUnlocked(index, missions, visibleCompletedIds));
  const journeyFinished = currentIndex === -1 && completedCount === missions.length;
  const mapCollectibles = getCollectiblesForMap(activeTheme.id);
  const visibleFoundCollectibleIds = isDemo ? mapCollectibles.map((item) => item.id) : foundCollectibleIds;
  const foundCollectibleCount = mapCollectibles.filter((item) => visibleFoundCollectibleIds.includes(item.id)).length;

  useEffect(() => {
    setFoundCollectibleIds(getFoundCollectibles(student.id, activeTheme.id));
  }, [student.id, activeTheme.id]);

  function chooseTheme(nextThemeId) {
    const nextThemeIndex = MAP_THEMES.findIndex((mapTheme) => mapTheme.id === nextThemeId);
    if (nextThemeIndex < 0 || nextThemeIndex >= unlockedMapCount) return;
    setThemeId(nextThemeId);
    saveTheme(student.id, nextThemeId);
  }

  return (
    <section className="mission-map" aria-labelledby="mission-map-title">
      <div className="mission-map-header">
        <div>
          <span className="section-kicker"><Map size={15} /> Peta kembara</span>
          <h2 id="mission-map-title">Hai, {student.nickname || "kembara"}!</h2>
          <p>{isDemo ? "Semua peta, latihan dan koleksi tersedia untuk diterokai." : isGuest ? "Demo membuka peta pertama sahaja." : journeyFinished ? "Semua peta untuk laluan ini sudah terbuka. Pilih mana-mana untuk bermain semula." : "Lengkapkan koleksi peta untuk membuka peta seterusnya."}</p>
        </div>
        <span className="mission-map-count"><Sparkles size={15} /> {completedCount}/{missions.length} checkpoint</span>
      </div>

      <div className="mission-map-theme-picker" aria-label="Pilih tema peta">
        <span className="mission-map-theme-label">Pilih peta</span>
        <div className="mission-map-theme-options">
          {availableThemes.map((mapTheme, index) => {
            const locked = index >= unlockedMapCount;
            const selected = mapTheme.id === activeTheme.id;
            return (
            <button className={`mission-map-theme-option ${selected ? "is-selected" : ""} ${locked ? "is-locked" : ""}`} key={mapTheme.id} type="button" onClick={() => chooseTheme(mapTheme.id)} disabled={locked} aria-label={`${mapTheme.title}${locked ? ", belum terbuka" : ", pilih peta"}`} aria-pressed={selected}>
              <img src={mapTheme.thumbnail} alt="" />
              <span className="mission-map-theme-name">{mapTheme.title}</span>
              {locked && <span className="mission-map-theme-lock"><LockKeyhole size={13} /> Lengkapkan koleksi peta {index}</span>}
            </button>
            );
          })}
        </div>
      </div>

      <div className="mission-map-collection-bar">
        <span><Gift size={15} /> {foundCollectibleCount}/{mapCollectibles.length} koleksi di {activeTheme.title}</span>
        <button type="button" onClick={() => setCollectionOpen((open) => !open)} aria-expanded={collectionOpen}>
          <BookOpen size={15} /> {collectionOpen ? "Tutup koleksi" : "Lihat koleksi"}
        </button>
      </div>
      {collectionOpen && (
        <div className="mission-map-collection" aria-label={`Koleksi ${activeTheme.title}`}>
          <div className="mission-map-collection-heading">
            <strong>Barang yang dijumpai</strong>
            <small>{foundCollectibleCount} daripada {mapCollectibles.length}</small>
          </div>
          <p className="mission-map-collection-prompt">Lengkapkan aktiviti pembelajaran, latihan, permainan atau ujian untuk menjumpai koleksi baharu.</p>
          <div className="mission-map-collection-grid">
            {mapCollectibles.map((item, index) => {
              const found = visibleFoundCollectibleIds.includes(item.id);
              return (
                <div className={`mission-map-collection-item ${found ? "is-found" : "is-hidden"}`} key={item.id}>
                  <CollectibleSprite item={item} size="tile" hidden={!found} />
                  <span>{found ? item.name : `Rahsia ${index + 1}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mission-map-legend" aria-label="Petunjuk peta"><span><span className="legend-dot legend-dot-current" /> Sekarang</span><span><span className="legend-dot legend-dot-complete" /> Boleh ulang</span><span><span className="legend-dot legend-dot-locked" /> Berkabus</span></div>
      <ol className="mission-map-path" style={{ "--map-background": `url("${activeTheme.image}")` }}>
        {visibleMissions.map((mission) => {
          const index = missions.findIndex((item) => item.id === mission.id);
          const state = visibleCompletedIds.includes(mission.id)
            ? "complete"
            : isMissionUnlocked(index, missions, visibleCompletedIds) && (!isGuest || isDemo || index === 0)
              ? "current"
              : "locked";
          return <MissionNode key={mission.id} mission={mission} index={index} state={state} href={mission.route} position={activeTheme.positions[index] || activeTheme.positions[activeTheme.positions.length - 1]} />;
        })}
        {isGuest && missions.length > 1 && (
          <li className="mission-map-more-locked"><LockKeyhole size={17} /><span><strong>Lebih banyak misi menanti</strong><small>Simpan kemajuan dengan akaun murid.</small></span></li>
        )}
      </ol>
    </section>
  );
}
