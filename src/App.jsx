import { useEffect } from "react";
import AdditionRegroupGame from "./games/additionRegroup/AdditionRegroupGame.jsx";
import KvSoundPondGame from "./games/kvSoundPond/KvSoundPondGame.jsx";
import MinusRegroupGame from "./games/minusRegroup/MinusRegroupGame.jsx";
import MosquitoSplatGame from "./games/mosquitoSplat/MosquitoSplatGame.jsx";
import HomeLanding from "./components/home/HomeLanding.jsx";
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
