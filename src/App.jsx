import { useEffect, useState } from "react";
import AdditionRegroupGame from "./games/additionRegroup/AdditionRegroupGame.jsx";
import KvSoundPondGame from "./games/kvSoundPond/KvSoundPondGame.jsx";
import MinusRegroupGame from "./games/minusRegroup/MinusRegroupGame.jsx";
import MosquitoSplatGame from "./games/mosquitoSplat/MosquitoSplatGame.jsx";
import MultiplicationZombieGame from "./games/multiplicationZombie/MultiplicationZombieGame.jsx";
import HomeLanding from "./components/home/HomeLanding.jsx";
import RoleChooser from "./components/home/RoleChooser.jsx";
import StudentDashboard from "./components/home/StudentDashboard.jsx";
import MissionAccessRequired from "./components/home/MissionAccessRequired.jsx";
import TeacherHub from "./components/home/TeacherHub.jsx";
import BahasaMelayuHub from "./components/bm/BahasaMelayuHub.jsx";
import MathLearningJourney from "./components/math/MathLearningJourney.jsx";
import MathHub from "./components/math/MathHub.jsx";
import KVKGame from "./components/kvk/KVKGame.jsx";
import AdultLogin from "./components/kembara/AdultLogin.jsx";
import AdminPanel from "./components/kembara/AdminPanel.jsx";
import AdultDashboard from "./components/kembara/AdultDashboard.jsx";
import DemoTeacherDashboard from "./components/kembara/DemoTeacherDashboard.jsx";
import StudentClassEntry from "./components/kembara/StudentClassEntry.jsx";
import GuestDemoGate from "./components/kembara/GuestDemoGate.jsx";
import RateLimitToast from "./components/kembara/RateLimitToast.jsx";
import LoadingScreen from "./components/kembara/LoadingScreen.jsx";
import { isInteractiveTarget, playInterfaceClick } from "./utils/interfaceAudio.js";
import { getActiveAdult, getActiveStudent, isDemoSessionValid, isGuestPathAllowed, refreshAppMeta, startDemoSession, startKembaraAuth, whenAuthReady } from "./utils/kembaraStore.js";
import { getMissionById, getMissionsForTrack } from "./data/missions.js";
import { MAP_THEMES } from "./data/mapThemes.js";
import { completeMission, getMissionProgress, isMissionUnlocked } from "./utils/missionProgress.js";
import { discoverCollectible, missionRewardMap } from "./utils/collectibleProgress.js";
import { activityHref, teacherReturnPath } from "./utils/activityNavigation.js";
import "./styles.css";

function useInterfaceClickSound() {
  useEffect(() => {
    const handleDocumentActivation = (event) => {
      const control = isInteractiveTarget(event.target);
      if (!control || control.disabled || control.getAttribute("aria-disabled") === "true") return;
      if (control.closest("[data-silent-interface]")) return;
      if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
      playInterfaceClick();
    };

    document.addEventListener("pointerdown", handleDocumentActivation, true);
    document.addEventListener("keydown", handleDocumentActivation, true);
    return () => {
      document.removeEventListener("pointerdown", handleDocumentActivation, true);
      document.removeEventListener("keydown", handleDocumentActivation, true);
    };
  }, []);
}

function studentPath(path, teacherMode = false) {
  const adult = getActiveAdult();
  const student = getActiveStudent();
  if (adult && (teacherMode || !student)) return { preview: true, track: "both" };
  if (!student) {
    window.location.replace("/murid");
    return null;
  }
  if (student.isGuest && !isGuestPathAllowed(path)) return <GuestDemoGate />;
  return student;
}

function DemoUnavailable() {
  return (
    <main className="portal-page">
      <section className="profile-content guest-gate">
        <span className="portal-eyebrow">Demo tidak tersedia</span>
        <h1>Pautan demo ditutup</h1>
        <p>Pautan ini tidak lagi aktif. Sila minta admin mengaktifkan demo semula.</p>
        <a className="new-profile-button" href="/">Kembali ke laman utama</a>
      </section>
    </main>
  );
}

function missionAccess(student, missionId) {
  if (student.preview) return { mission: null, onComplete: undefined };
  if (!missionId) return { mission: null, onComplete: undefined };
  const mission = getMissionById(missionId);
  if (!mission) return { mission: null, onComplete: undefined };
  const missions = getMissionsForTrack(student.track);
  const missionIndex = missions.findIndex((item) => item.id === missionId);
  const progress = getMissionProgress(student.id);
  if (missionIndex < 0 || (!student.isDemo && student.isGuest && missionIndex > 0) || (!student.isDemo && !isMissionUnlocked(missionIndex, missions, progress.completedIds))) {
    return { blocked: true };
  }
  return {
    mission,
    onComplete: () => {
      completeMission(student.id, missionId);
      const theme = missionRewardMap(student.id, new URLSearchParams(window.location.search).get("map"), Math.min(MAP_THEMES.length, missions.length), student);
      discoverCollectible(student.id, theme.id);
    }
  };
}

function RouteView() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(window.location.search);
  const teacherMode = params.get("mode") === "teacher";
  const activityPaths = ["/murid/bahasa-melayu", "/murid/matematik", "/murid/matematik/aktiviti", "/kvk", "/kv-sound-pond", "/addition-regroup", "/minus-regroup", "/zombie-defense", "/multiplication-zombie", "/mosquito-splat"];
  if (teacherMode && activityPaths.includes(path) && !getActiveAdult()) {
    window.location.replace("/cikgu");
    return null;
  }
  const bmBackPath = teacherMode ? teacherReturnPath(params) : "/murid/ruang";
  const mathBackPath = teacherMode ? teacherReturnPath(params, "math") : "/murid/matematik/aktiviti";
  if (path === "/demo/student") return <StudentDashboard />;
  if (path === "/demo/teacher") return <DemoTeacherDashboard />;
  if (path === "/demo/tidak-tersedia") return <DemoUnavailable />;
  if (path === "/") return <RoleChooser />;
  if (path === "/murid") return <StudentClassEntry />;
  if (path === "/cikgu") return <AdultLogin />;
  if (path === "/akaun") return getActiveAdult()?.isDemo ? <DemoTeacherDashboard /> : <AdultDashboard />;
  if (path === "/admin") return <AdminPanel />;
  if (path === "/murid/demo-tamat") return <GuestDemoGate />;
  if (path === "/cikgu/mengajar") return <TeacherHub teachingMode />;
  if (path === "/cikgu/panduan") return <TeacherHub />;
  if (path === "/cikgu/bahasa-melayu") return <TeacherHub initialSubject="bm" />;
  if (path === "/cikgu/matematik") return <TeacherHub initialSubject="math" />;

  if (path === "/murid/ruang") {
    const student = studentPath(path, teacherMode);
    if (!student || student.$$typeof) return student;
    if (student.preview) {
      window.location.replace("/cikgu/mengajar");
      return null;
    }
    return <StudentDashboard />;
  }

  if (path === "/murid/bahasa-melayu") {
    const student = studentPath(path, teacherMode);
    if (!student || student.$$typeof) return student;
    if (student.track === "math") {
      window.location.replace("/murid/matematik");
      return null;
    }
    const missionId = params.get("mission");
    const access = missionAccess(student, missionId);
    if (access.blocked) return <MissionAccessRequired />;
    return <BahasaMelayuHub initialCategory={params.get("category")} initialActivity={params.get("activity")} teachingMode={teacherMode} teacherReturnTo={params.get("returnTo")} initialMission={missionId} onMissionComplete={access.onComplete} onBack={() => { window.location.href = bmBackPath; }} onComingSoon={() => {}} notice="" />;
  }

  if (path === "/murid/matematik" || path === "/murid/matematik/aktiviti") {
    const student = studentPath(path, teacherMode);
    if (!student || student.$$typeof) return student;
    if (student.track === "bm") {
      window.location.replace("/murid/bahasa-melayu");
      return null;
    }
    if (path.endsWith("/aktiviti")) return <MathHub onBack={() => { window.location.href = teacherMode ? mathBackPath : "/murid/matematik"; }} teachingMode={teacherMode} teacherReturnTo={params.get("returnTo")} />;
    return <MathLearningJourney teachingMode={teacherMode} activitiesHref={activityHref("/murid/matematik/aktiviti", { teacherMode, returnTo: params.get("returnTo") })} onBack={() => { window.location.href = teacherMode ? mathBackPath : "/murid/ruang"; }} />;
  }

  if (path === "/kvk") {
    const student = studentPath(path, teacherMode);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    return <KVKGame backHref={teacherMode ? bmBackPath : "/murid/bahasa-melayu?category=suku-kata"} />;
  }
  if (path === "/kv-sound-pond") {
    const student = studentPath(path, teacherMode);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    const missionId = new URLSearchParams(window.location.search).get("mission");
    const access = missionAccess(student, missionId);
    if (access.blocked) return <MissionAccessRequired />;
    const backHref = missionId && !teacherMode ? "/murid/ruang" : activityHref("/murid/bahasa-melayu?category=suku-kata", { teacherMode, returnTo: params.get("returnTo") });
    return <KvSoundPondGame onComplete={access.onComplete} backHref={backHref} />;
  }
  if (path === "/addition-regroup") {
    const student = studentPath(path, teacherMode);
    if (!student || student.$$typeof) return student;
    const missionId = new URLSearchParams(window.location.search).get("mission");
    const access = missionAccess(student, missionId);
    if (access.blocked) return <MissionAccessRequired />;
    return <AdditionRegroupGame onComplete={access.onComplete} backHref={missionId && !teacherMode ? "/murid/ruang" : mathBackPath} teachingMode={teacherMode} teacherReturnTo={params.get("returnTo")} />;
  }
  if (path === "/minus-regroup") {
    const student = studentPath(path, teacherMode);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    return <MinusRegroupGame backHref={mathBackPath} teachingMode={teacherMode} teacherReturnTo={params.get("returnTo")} />;
  }
  if (path === "/zombie-defense" || path === "/multiplication-zombie") {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode") === "teacher" ? "teacher" : "student";
    const initialOperation = params.get("op") || "darab";
    if (mode === "teacher") return <MultiplicationZombieGame initialMode="teacher" initialOperation={initialOperation} assessmentMode={params.get("assessment") === "1"} backHref={mathBackPath} />;
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    const missionId = params.get("mission");
    const access = missionAccess(student, missionId);
    if (access.blocked) return <MissionAccessRequired />;
    return <MultiplicationZombieGame initialMode="student" initialOperation={initialOperation} assessmentMode={params.get("assessment") === "1"} onComplete={access.onComplete} backHref={params.has("mission") ? "/murid/ruang" : mathBackPath} />;
  }
  if (path === "/mosquito-splat") {
    const params = new URLSearchParams(window.location.search);
    const initialOp = params.get("op");
    const mode = params.get("mode") === "teacher" ? "teacher" : "student";
    if (mode === "teacher") return <MosquitoSplatGame initialMode="teacher" initialOp={initialOp} backHref={mathBackPath} />;
    // Old links keep the Darab-to-Zombie compatibility alias; the explicit
    // chooser must be able to launch the real multiplication mosquito game.
    if (initialOp === "darab" && params.get("game") !== "mosquito") {
      const student = studentPath(path);
      if (!student || student.$$typeof) return student;
      if (student.isGuest) return <GuestDemoGate />;
      return <MultiplicationZombieGame initialMode="student" initialOperation="darab" backHref={mathBackPath} />;
    }
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    return <MosquitoSplatGame initialOp={initialOp} backHref={mathBackPath} />;
  }
  return <HomeLanding />;
}

function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [demoError, setDemoError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      startKembaraAuth();
      await whenAuthReady();
      await refreshAppMeta();
      const path = window.location.pathname.replace(/\/+$/, "") || "/";
      if (path === "/demo/student" || path === "/demo/teacher") {
        const role = path.endsWith("/student") ? "student" : "teacher";
        const token = new URLSearchParams(window.location.search).get("token");
        if (token || !isDemoSessionValid(role)) {
          const result = await startDemoSession(role, token);
          if (!result.ok && !cancelled) setDemoError(true);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready) {
    return (
      <LoadingScreen />
    );
  }

  return demoError ? <DemoUnavailable /> : children;
}

export default function App() {
  useInterfaceClickSound();
  return (
    <AuthGate>
      <RouteView />
      <RateLimitToast />
    </AuthGate>
  );
}
