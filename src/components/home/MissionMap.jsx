import { ArrowRight, Castle, Check, Home, LockKeyhole, Map, Mountain, Sparkles, TreePine, Waves } from "lucide-react";
import { getMissionsForTrack, missionIconForState } from "../../data/missions.js";
import { getMissionProgress, isMissionUnlocked, subscribeToMissionProgress } from "../../utils/missionProgress.js";
import { useEffect, useState } from "react";

const LANDMARKS = [Home, Waves, TreePine, Mountain, Castle];

function MissionNode({ mission, state, index, href }) {
  const Icon = state === "complete" ? Check : state === "locked" ? LockKeyhole : missionIconForState(state);
  const Landmark = LANDMARKS[index % LANDMARKS.length];
  const node = (
    <span className={`mission-map-landmark mission-map-landmark-${state}`}>
      <span className="mission-map-landmark-art"><Landmark size={54} strokeWidth={1.7} /><span className="mission-map-landmark-node"><Icon size={18} strokeWidth={2.8} /></span></span>
      <span className="mission-map-node-number">{String(index + 1).padStart(2, "0")}</span>
      {state === "locked" && <span className="mission-map-fog" aria-hidden="true"><LockKeyhole size={24} /></span>}
    </span>
  );

  return (
    <li className={`mission-map-stop mission-map-stop-${state}`}>
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
  const missions = getMissionsForTrack(student.track);
  const isGuest = Boolean(student.isGuest);
  const visibleMissions = isGuest ? missions.slice(0, 1) : missions;

  useEffect(() => {
    setCompletedIds(getMissionProgress(student.id).completedIds);
    return subscribeToMissionProgress((detail) => {
      if (!detail || detail.studentId === student.id) {
        setCompletedIds(getMissionProgress(student.id).completedIds);
      }
    });
  }, [student.id]);

  const completedCount = missions.filter((mission) => completedIds.includes(mission.id)).length;
  const currentIndex = missions.findIndex((mission, index) => !completedIds.includes(mission.id) && isMissionUnlocked(index, missions, completedIds));
  const journeyFinished = currentIndex === -1 && completedCount === missions.length;

  return (
    <section className="mission-map" aria-labelledby="mission-map-title">
      <div className="mission-map-header">
        <div>
          <span className="section-kicker"><Map size={15} /> Peta kembara</span>
          <h2 id="mission-map-title">Hai, {student.nickname || "kembara"}!</h2>
          <p>{isGuest ? "Demo membuka checkpoint pertama sahaja." : journeyFinished ? "Semua checkpoint sudah terbuka. Pilih mana-mana untuk bermain semula." : "Teruskan perjalanan untuk membuka kawasan berkabus seterusnya."}</p>
        </div>
        <span className="mission-map-count"><Sparkles size={15} /> {completedCount}/{missions.length} checkpoint</span>
      </div>

      <div className="mission-map-legend" aria-label="Petunjuk peta"><span><span className="legend-dot legend-dot-current" /> Sekarang</span><span><span className="legend-dot legend-dot-complete" /> Boleh ulang</span><span><span className="legend-dot legend-dot-locked" /> Berkabus</span></div>
      <ol className="mission-map-path">
        {visibleMissions.map((mission) => {
          const index = missions.findIndex((item) => item.id === mission.id);
          const state = completedIds.includes(mission.id)
            ? "complete"
            : isMissionUnlocked(index, missions, completedIds) && (!isGuest || index === 0)
              ? "current"
              : "locked";
          return <MissionNode key={mission.id} mission={mission} index={index} state={state} href={mission.route} />;
        })}
        {isGuest && missions.length > 1 && (
          <li className="mission-map-more-locked"><LockKeyhole size={17} /><span><strong>Lebih banyak misi menanti</strong><small>Simpan kemajuan dengan akaun murid.</small></span></li>
        )}
      </ol>
    </section>
  );
}
