import { useEffect, useState } from "react";
import AdditionRegroupGame from "./games/additionRegroup/AdditionRegroupGame.jsx";
import KvSoundPondGame from "./games/kvSoundPond/KvSoundPondGame.jsx";
import MinusRegroupGame from "./games/minusRegroup/MinusRegroupGame.jsx";
import MosquitoSplatGame from "./games/mosquitoSplat/MosquitoSplatGame.jsx";
import HomeLanding from "./components/home/HomeLanding.jsx";
import RoleChooser from "./components/home/RoleChooser.jsx";
import StudentDashboard from "./components/home/StudentDashboard.jsx";
import TeacherHub from "./components/home/TeacherHub.jsx";
import BahasaMelayuHub from "./components/bm/BahasaMelayuHub.jsx";
import MathHub from "./components/math/MathHub.jsx";
import KVKGame from "./components/kvk/KVKGame.jsx";
import AdultLogin from "./components/kembara/AdultLogin.jsx";
import AdminPanel from "./components/kembara/AdminPanel.jsx";
import AdultDashboard from "./components/kembara/AdultDashboard.jsx";
import StudentClassEntry from "./components/kembara/StudentClassEntry.jsx";
import GuestDemoGate from "./components/kembara/GuestDemoGate.jsx";
import RateLimitToast from "./components/kembara/RateLimitToast.jsx";
import { isInteractiveTarget, playInterfaceClick } from "./utils/interfaceAudio.js";
import { getActiveAdult, getActiveStudent, isGuestPathAllowed, startKembaraAuth, whenAuthReady } from "./utils/kembaraStore.js";
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

function studentPath(path) {
  const adult = getActiveAdult();
  const student = getActiveStudent();
  if (adult && !student) return { preview: true, track: "both" };
  if (!student) {
    window.location.replace("/murid");
    return null;
  }
  if (student.isGuest && !isGuestPathAllowed(path)) return <GuestDemoGate />;
  return student;
}

function RouteView() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return <RoleChooser />;
  if (path === "/murid") return <StudentClassEntry />;
  if (path === "/cikgu") return <AdultLogin />;
  if (path === "/akaun") return <AdultDashboard />;
  if (path === "/admin") return <AdminPanel />;
  if (path === "/murid/demo-tamat") return <GuestDemoGate />;
  if (path === "/cikgu/mengajar") return <TeacherHub teachingMode />;
  if (path === "/cikgu/panduan") return <TeacherHub />;
  if (path === "/cikgu/bahasa-melayu") return <TeacherHub initialSubject="bm" />;
  if (path === "/cikgu/matematik") return <TeacherHub initialSubject="math" />;

  if (path === "/murid/ruang") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    return <StudentDashboard />;
  }

  if (path === "/murid/bahasa-melayu") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.track === "math") {
      window.location.replace("/murid/matematik");
      return null;
    }
    return <BahasaMelayuHub onBack={() => { window.location.href = "/murid/ruang"; }} onComingSoon={() => {}} notice="" />;
  }

  if (path === "/murid/matematik") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.track === "bm") {
      window.location.replace("/murid/bahasa-melayu");
      return null;
    }
    return <MathHub onBack={() => { window.location.href = "/murid/ruang"; }} onComingSoon={() => {}} notice="" />;
  }

  if (path === "/kvk") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    return <KVKGame />;
  }
  if (path === "/kv-sound-pond") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    return <KvSoundPondGame />;
  }
  if (path === "/addition-regroup") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    return <AdditionRegroupGame />;
  }
  if (path === "/minus-regroup") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    return <MinusRegroupGame />;
  }
  if (path === "/mosquito-splat") {
    const student = studentPath(path);
    if (!student || student.$$typeof) return student;
    if (student.isGuest) return <GuestDemoGate />;
    return <MosquitoSplatGame initialOp={new URLSearchParams(window.location.search).get("op")} />;
  }
  return <HomeLanding />;
}

function AuthGate({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startKembaraAuth();
    whenAuthReady().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <main className="portal-page">
        <section className="profile-content">
          <p className="portal-note">Menyambung Firebase...</p>
        </section>
      </main>
    );
  }

  return children;
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
