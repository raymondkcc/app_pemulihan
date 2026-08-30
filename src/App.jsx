import { useEffect } from "react";
import AdditionRegroupGame from "./games/additionRegroup/AdditionRegroupGame.jsx";
import KvSoundPondGame from "./games/kvSoundPond/KvSoundPondGame.jsx";
import MinusRegroupGame from "./games/minusRegroup/MinusRegroupGame.jsx";
import MosquitoSplatGame from "./games/mosquitoSplat/MosquitoSplatGame.jsx";
import HomeLanding from "./components/home/HomeLanding.jsx";
import RoleChooser from "./components/home/RoleChooser.jsx";
import StudentEntry from "./components/home/StudentEntry.jsx";
import StudentDashboard from "./components/home/StudentDashboard.jsx";
import TeacherHub from "./components/home/TeacherHub.jsx";
import KVKGame from "./components/kvk/KVKGame.jsx";
import { isInteractiveTarget, playInterfaceClick } from "./utils/interfaceAudio.js";
import "./styles.css";

function useInterfaceClickSound() {
  useEffect(() => {
    const handleDocumentActivation = (event) => {
      const control = isInteractiveTarget(event.target);
      if (!control || control.disabled || control.getAttribute("aria-disabled") === "true") return;
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

function RouteView() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return <RoleChooser />;
  if (path === "/murid") return <StudentEntry />;
  if (path === "/murid/ruang") return <StudentDashboard />;
  if (path === "/cikgu") return <TeacherHub />;
  if (path === "/cikgu/bahasa-melayu") return <TeacherHub initialSubject="bm" />;
  if (path === "/cikgu/matematik") return <TeacherHub initialSubject="math" />;
  if (path === "/murid/bahasa-melayu") return <BahasaMelayuHub onBack={() => { window.location.href = "/murid/ruang"; }} onComingSoon={() => {}} notice="" />;
  if (path === "/murid/matematik") return <MathHub onBack={() => { window.location.href = "/murid/ruang"; }} onComingSoon={() => {}} notice="" />;
  if (path === "/kvk") return <KVKGame />;
  if (path === "/kv-sound-pond") return <KvSoundPondGame />;
  if (path === "/addition-regroup") return <AdditionRegroupGame />;
  if (path === "/minus-regroup") return <MinusRegroupGame />;
  if (path === "/mosquito-splat") return <MosquitoSplatGame initialOp={new URLSearchParams(window.location.search).get("op")} />;
  return <HomeLanding />;
}

export default function App() {
  useInterfaceClickSound();
  return <RouteView />;
}
