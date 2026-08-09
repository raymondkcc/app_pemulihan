import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, Line, RoundedBox, Sparkles, useAnimations, useGLTF } from "@react-three/drei";
import {
  ArrowLeft,
  Check,
  Clock,
  Frown,
  HeartPulse,
  Pause,
  PawPrint,
  Play,
  RotateCcw,
  Smile,
  Target,
  Trophy,
  Users,
  Utensils,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import {
  DIFFICULTIES,
  GAME_MODES,
  OPERATION_META,
  PETS,
  advanceAfterWrong,
  answerSession,
  createSession,
  formatTime,
  getDifficulty,
  getMode,
  getPet,
  tickSession
} from "./petFeedingSimulation.js";
import "./petFeeding.css";

const PET_SCALE = 1.05;

const TOY_INK = "#3b2930";
const TOY_CREAM = "#fff4d6";
const TOY_PINK = "#ef9c9b";
const TOY_BLUE = "#79c7db";

function softTone(context, frequency, duration, type = "sine", volume = 0.06) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function ModeIcon({ modeId }) {
  if (modeId === "speedrun") return <Zap size={18} strokeWidth={2.6} />;
  if (modeId === "test") return <Target size={18} strokeWidth={2.6} />;
  return <PawPrint size={18} strokeWidth={2.6} />;
}

function PetEye({ position, mood, side }) {
  if (mood === "faint") {
    return (
      <Line
        points={side === "left" ? [[-0.095, -0.095, 0], [0.095, 0.095, 0]] : [[-0.095, 0.095, 0], [0.095, -0.095, 0]]}
        color={TOY_INK}
        lineWidth={4}
        position={position}
      />
    );
  }

  const isSad = mood === "sad";
  return (
    <group position={position}>
      <mesh scale={[1, isSad ? 1.1 : 1, 1]} castShadow>
        <sphereGeometry args={[0.12, 20, 16]} />
        <meshStandardMaterial color={TOY_CREAM} roughness={0.52} />
      </mesh>
      <mesh position={[0, isSad ? -0.005 : 0, 0.105]} scale={[0.62, isSad ? 1.05 : 0.9, 0.76]}>
        <sphereGeometry args={[0.078, 18, 14]} />
        <meshStandardMaterial color={TOY_INK} roughness={0.36} />
      </mesh>
      <mesh position={[-0.022, 0.042, 0.164]} scale={[0.025, 0.032, 0.018]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
    </group>
  );
}

function PetFace({ mood, scale = 1, position = [0, 1.35, 0.5] }) {
  const isSad = mood === "sad";
  const isHappy = mood === "happy";
  const isFaint = mood === "faint";
  const mouthPoints = isSad
    ? [[-0.15, -0.16, 0], [0, -0.08, 0], [0.15, -0.16, 0]]
    : [[-0.15, -0.1, 0], [0, -0.19, 0], [0.15, -0.1, 0]];
  const browColor = isSad ? "#6b3a43" : TOY_INK;

  return (
    <group scale={scale} position={position}>
      <PetEye position={[-0.22, 0.09, 0.02]} mood={mood} side="left" />
      <PetEye position={[0.22, 0.09, 0.02]} mood={mood} side="right" />
      {!isFaint && (
        <>
          <mesh position={[-0.3, -0.09, -0.01]} scale={[0.085, 0.048, 0.024]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={isSad ? "#d37a83" : TOY_PINK} roughness={0.7} />
          </mesh>
          <mesh position={[0.3, -0.09, -0.01]} scale={[0.085, 0.048, 0.024]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={isSad ? "#d37a83" : TOY_PINK} roughness={0.7} />
          </mesh>
          {isSad && (
            <>
              <Line points={[[-0.3, 0.28, 0], [-0.1, 0.34, 0]]} color={browColor} lineWidth={4} />
              <Line points={[[0.1, 0.34, 0], [0.3, 0.28, 0]]} color={browColor} lineWidth={4} />
              <mesh position={[-0.22, -0.055, 0.08]} scale={[0.035, 0.075, 0.026]} rotation={[0, 0, -0.18]}>
                <sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial color={TOY_BLUE} roughness={0.25} />
              </mesh>
              <mesh position={[0.22, -0.055, 0.08]} scale={[0.035, 0.075, 0.026]} rotation={[0, 0, 0.18]}>
                <sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial color={TOY_BLUE} roughness={0.25} />
              </mesh>
            </>
          )}
          {!isSad && <Line points={[[-0.3, 0.28, 0], [-0.13, 0.3, 0]]} color={browColor} lineWidth={2.3} />}
          {!isSad && <Line points={[[0.13, 0.3, 0], [0.3, 0.28, 0]]} color={browColor} lineWidth={2.3} />}
          <Line points={mouthPoints} color={TOY_INK} lineWidth={isHappy ? 3.6 : 2.8} />
          {isHappy && (
            <mesh position={[0, -0.18, 0.04]} scale={[0.065, 0.035, 0.02]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#e9787e" roughness={0.5} />
            </mesh>
          )}
        </>
      )}
      {isFaint && <Line points={[[-0.17, -0.18, 0], [0.17, 0.18, 0]]} color={TOY_INK} lineWidth={3.2} />}
    </group>
  );
}

function PetLeg({ position, color, scale = [1, 1, 1] }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <capsuleGeometry args={[0.12, 0.29, 6, 12]} />
      <meshStandardMaterial color={color} roughness={0.72} />
    </mesh>
  );
}

function PetPaw({ position, color, scale = [1, 1, 1] }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.2, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.015, 0.16]} scale={[0.52, 0.32, 0.28]}>
        <sphereGeometry args={[0.12, 16, 10]} />
        <meshStandardMaterial color="#f8c7a4" roughness={0.62} />
      </mesh>
    </group>
  );
}

function Whiskers() {
  return (
    <group>
      <Line points={[[-0.28, -0.05, 0], [-0.62, 0.05, 0]]} color="#fff0d2" lineWidth={1.2} />
      <Line points={[[-0.3, -0.13, 0], [-0.65, -0.13, 0]]} color="#fff0d2" lineWidth={1.2} />
      <Line points={[[0.28, -0.05, 0], [0.62, 0.05, 0]]} color="#fff0d2" lineWidth={1.2} />
      <Line points={[[0.3, -0.13, 0], [0.65, -0.13, 0]]} color="#fff0d2" lineWidth={1.2} />
    </group>
  );
}

function CatPet({ mood }) {
  const color = "#e77b5d";
  const light = "#ffd28b";
  const stripe = "#b65351";
  return (
    <group>
      <mesh position={[0, 0.78, 0]} scale={[1.12, 0.7, 0.98]} castShadow>
        <capsuleGeometry args={[0.52, 0.48, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh position={[-0.48, 0.55, -0.04]} scale={[0.3, 0.4, 0.34]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.48, 0.55, -0.04]} scale={[0.3, 0.4, 0.34]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <PetLeg position={[-0.3, 0.38, 0.48]} color={color} scale={[0.92, 1.05, 0.92]} />
      <PetLeg position={[0.3, 0.38, 0.48]} color={color} scale={[0.92, 1.05, 0.92]} />
      <PetPaw position={[-0.48, 0.27, 0]} color={color} scale={[1.05, 0.84, 1.08]} />
      <PetPaw position={[0.48, 0.27, 0]} color={color} scale={[1.05, 0.84, 1.08]} />
      <PetPaw position={[-0.3, 0.25, 0.52]} color={color} scale={[0.9, 0.72, 0.92]} />
      <PetPaw position={[0.3, 0.25, 0.52]} color={color} scale={[0.9, 0.72, 0.92]} />
      <mesh position={[0, 0.78, 0.7]} scale={[0.34, 0.44, 0.06]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={light} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.45, 0.02]} scale={[0.58, 0.52, 0.56]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color={color} roughness={0.64} />
      </mesh>
      <mesh position={[-0.4, 1.91, 0.02]} rotation={[0, 0, -0.12]} castShadow>
        <coneGeometry args={[0.29, 0.58, 4]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh position={[0.4, 1.91, 0.02]} rotation={[0, 0, 0.12]} castShadow>
        <coneGeometry args={[0.29, 0.58, 4]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
      <mesh position={[-0.4, 1.9, 0.25]} rotation={[0, 0, -0.12]}>
        <coneGeometry args={[0.14, 0.34, 4]} />
        <meshStandardMaterial color={light} roughness={0.68} />
      </mesh>
      <mesh position={[0.4, 1.9, 0.25]} rotation={[0, 0, 0.12]}>
        <coneGeometry args={[0.14, 0.34, 4]} />
        <meshStandardMaterial color={light} roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.34, 0.61]} scale={[0.13, 0.095, 0.07]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#8e4d40" roughness={0.5} />
      </mesh>
      <PetFace mood={mood} position={[0, 1.42, 0.63]} scale={1.08} />
      <group position={[0, 1.3, 0.66]}><Whiskers /></group>
      <mesh position={[-0.3, 1.58, 0.62]} rotation={[0, 0, -0.55]} scale={[0.13, 0.035, 0.022]}>
        <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        <meshStandardMaterial color={stripe} roughness={0.66} />
      </mesh>
      <mesh position={[-0.27, 1.49, 0.64]} rotation={[0, 0, -0.32]} scale={[0.12, 0.032, 0.022]}>
        <capsuleGeometry args={[0.08, 0.18, 4, 8]} />
        <meshStandardMaterial color={stripe} roughness={0.66} />
      </mesh>
      <mesh position={[0.3, 1.58, 0.62]} rotation={[0, 0, 0.55]} scale={[0.13, 0.035, 0.022]}>
        <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
        <meshStandardMaterial color={stripe} roughness={0.66} />
      </mesh>
      <mesh position={[0.27, 1.49, 0.64]} rotation={[0, 0, 0.32]} scale={[0.12, 0.032, 0.022]}>
        <capsuleGeometry args={[0.08, 0.18, 4, 8]} />
        <meshStandardMaterial color={stripe} roughness={0.66} />
      </mesh>
      <mesh position={[0.66, 0.93, -0.08]} rotation={[0, 0, -0.9]} castShadow>
        <torusGeometry args={[0.38, 0.085, 10, 18, Math.PI * 1.45]} />
        <meshStandardMaterial color={color} roughness={0.68} />
      </mesh>
    </group>
  );
}

function BunnyPet({ mood }) {
  const color = "#d8a84e";
  const light = "#f8df8a";
  return (
    <group>
      <mesh position={[0, 0.8, 0]} scale={[1.12, 0.72, 0.96]} castShadow>
        <capsuleGeometry args={[0.52, 0.52, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[-0.5, 0.54, -0.02]} scale={[0.34, 0.42, 0.38]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0.5, 0.54, -0.02]} scale={[0.34, 0.42, 0.38]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <PetLeg position={[-0.29, 0.38, 0.48]} color={color} scale={[1.04, 1.08, 0.98]} />
      <PetLeg position={[0.29, 0.38, 0.48]} color={color} scale={[1.04, 1.08, 0.98]} />
      <PetPaw position={[-0.5, 0.27, 0.2]} color={color} scale={[1.24, 0.9, 1.2]} />
      <PetPaw position={[0.5, 0.27, 0.2]} color={color} scale={[1.24, 0.9, 1.2]} />
      <PetPaw position={[-0.29, 0.25, 0.4]} color={color} scale={[0.94, 0.75, 1]} />
      <PetPaw position={[0.29, 0.25, 0.4]} color={color} scale={[0.94, 0.75, 1]} />
      <mesh position={[0, 0.8, 0.69]} scale={[0.34, 0.45, 0.06]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color="#f5d993" roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.48, 0.02]} scale={[0.59, 0.52, 0.55]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[-0.23, 2.02, 0]} rotation={[0, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.16, 0.55, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0.23, 2.02, 0]} rotation={[0, 0, 0.08]} castShadow>
        <capsuleGeometry args={[0.16, 0.55, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[-0.23, 2.02, 0.15]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.075, 0.36, 6, 10]} />
        <meshStandardMaterial color={light} roughness={0.7} />
      </mesh>
      <mesh position={[0.23, 2.02, 0.15]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.075, 0.36, 6, 10]} />
        <meshStandardMaterial color={light} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.33, 0.6]} scale={[0.1, 0.075, 0.06]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#c96e7c" roughness={0.5} />
      </mesh>
      <PetFace mood={mood} scale={1.04} position={[0, 1.47, 0.62]} />
      <mesh position={[0.66, 0.73, -0.05]} castShadow>
        <sphereGeometry args={[0.25, 18, 12]} />
        <meshStandardMaterial color="#f8e7b0" roughness={0.76} />
      </mesh>
    </group>
  );
}

function PuppyPet({ mood }) {
  const color = "#5a9e9d";
  const light = "#d5e7d5";
  const patch = "#9b654c";
  return (
    <group>
      <mesh position={[0, 0.8, 0]} scale={[1.14, 0.74, 0.98]} castShadow>
        <capsuleGeometry args={[0.54, 0.5, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[-0.5, 0.55, -0.04]} scale={[0.34, 0.42, 0.38]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0.5, 0.55, -0.04]} scale={[0.34, 0.42, 0.38]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <PetLeg position={[-0.31, 0.38, 0.5]} color={color} scale={[0.98, 1.08, 0.94]} />
      <PetLeg position={[0.31, 0.38, 0.5]} color={color} scale={[0.98, 1.08, 0.94]} />
      <PetPaw position={[-0.5, 0.27, 0.19]} color={color} scale={[1.1, 0.86, 1.12]} />
      <PetPaw position={[0.5, 0.27, 0.19]} color={color} scale={[1.1, 0.86, 1.12]} />
      <PetPaw position={[-0.31, 0.25, 0.42]} color={color} scale={[0.92, 0.74, 0.96]} />
      <PetPaw position={[0.31, 0.25, 0.42]} color={color} scale={[0.92, 0.74, 0.96]} />
      <mesh position={[0, 1.48, 0.02]} scale={[0.62, 0.52, 0.58]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[-0.52, 1.47, 0.03]} rotation={[0.12, 0.1, -0.24]} scale={[0.27, 0.49, 0.21]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0.52, 1.47, 0.03]} rotation={[0.12, -0.1, 0.24]} scale={[0.27, 0.49, 0.21]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.19, 0.62]} scale={[0.3, 0.22, 0.18]}>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color={light} roughness={0.78} />
      </mesh>
      <mesh position={[0, 1.34, 0.79]} scale={[0.14, 0.1, 0.065]}>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#382631" roughness={0.42} />
      </mesh>
      <mesh position={[-0.27, 1.56, 0.61]} scale={[0.18, 0.22, 0.045]} rotation={[0, 0, -0.18]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={patch} roughness={0.78} />
      </mesh>
      <PetFace mood={mood} scale={1.04} position={[0, 1.46, 0.65]} />
      <mesh position={[0, 0.98, 0.61]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.045, 8, 28]} />
        <meshStandardMaterial color="#f0bb50" roughness={0.46} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.98, 0.66]} scale={[0.08, 0.11, 0.035]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#f7d67c" roughness={0.42} metalness={0.1} />
      </mesh>
      <mesh position={[0.66, 0.93, -0.05]} rotation={[0, 0, -0.8]} castShadow>
        <torusGeometry args={[0.34, 0.09, 10, 18, Math.PI * 1.25]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

function PetModel({ petId, mood }) {
  if (petId === "bunny") return <BunnyPet mood={mood} />;
  if (petId === "puppy") return <PuppyPet mood={mood} />;
  return <CatPet mood={mood} />;
}

const PET_ASSETS = {
  cat: { path: "/assets/pets/milo-cat.glb", scale: 0.86, position: [0, 0.26, 0], rotation: [0, Math.PI, 0] },
  bunny: { path: "/assets/pets/pip-bunny.glb", scale: 0.62, position: [0, 0.23, 0], rotation: [0, Math.PI, 0] },
  puppy: { path: "/assets/pets/scout-dog.glb", scale: 0.64, position: [0, 0.23, 0], rotation: [0, Math.PI, 0] }
};

function findAnimation(animations, mood) {
  const names = animations.map((clip) => clip.name.toLowerCase());
  const wanted = mood === "happy" ? ["eating", "yes", "jump"] : mood === "sad" ? ["hitreact", "no", "hit"] : mood === "faint" ? ["death"] : ["idle"];
  const index = wanted.reduce((found, term) => found >= 0 ? found : names.findIndex((name) => name.includes(term)), -1);
  return index >= 0 ? animations[index].name : animations[0]?.name;
}

function AssetPet({ petId, mood }) {
  const config = PET_ASSETS[petId] || PET_ASSETS.cat;
  const { scene, animations } = useGLTF(config.path);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const animationRef = useRef(null);
  const { actions } = useAnimations(animations, animationRef);
  const activeName = findAnimation(animations, mood);

  useEffect(() => {
    const action = activeName ? actions[activeName] : null;
    if (!action) return undefined;
    action.reset().fadeIn(0.22).play();
    return () => action.fadeOut(0.18);
  }, [actions, activeName]);

  useEffect(() => {
    cloned.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.material) {
        object.material.roughness = Math.max(object.material.roughness ?? 0.7, 0.7);
        object.material.metalness = 0;
      }
    });
  }, [cloned]);

  return <primitive ref={animationRef} object={cloned} position={config.position} rotation={config.rotation} scale={config.scale} />;
}

Object.values(PET_ASSETS).forEach(({ path }) => useGLTF.preload(path));

function GrowthCrown({ level }) {
  if (level < 3) return null;
  return (
    <Float speed={2} rotationIntensity={0.12} floatIntensity={0.18}>
      <group position={[0, 2.55, 0.12]}>
        <mesh rotation={[0, 0, 0.22]}>
          <coneGeometry args={[0.18, 0.38, 5]} />
          <meshStandardMaterial color="#f3bd46" roughness={0.42} metalness={0.12} />
        </mesh>
        <Sparkles count={8} scale={0.7} size={2.4} speed={0.5} color="#ffe28a" />
      </group>
    </Float>
  );
}

function Treat({ mood }) {
  if (mood !== "happy") return null;
  return (
    <Float speed={2.6} rotationIntensity={0.3} floatIntensity={0.55}>
      <group position={[0.72, 1.58, 0.2]}>
        <mesh rotation={[0.15, 0.3, 0.2]} castShadow>
          <dodecahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial color="#f2bd4f" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.11, 0]} scale={[0.56, 0.26, 0.28]} rotation={[0, 0, 0.18]}>
          <sphereGeometry args={[0.15, 12, 8]} />
          <meshStandardMaterial color="#d98258" roughness={0.74} />
        </mesh>
      </group>
    </Float>
  );
}

function PetActor({ player, position, scale }) {
  const groupRef = useRef(null);
  const mood = player.health <= 0 ? "faint" : player.feedback?.type === "correct" ? "happy" : player.feedback?.type === "wrong" ? "sad" : "idle";

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const bounce = mood === "happy" ? Math.abs(Math.sin(time * 5.2)) * 0.12 : mood === "sad" ? Math.sin(time * 3.2) * 0.02 : Math.sin(time * 1.8) * 0.035;
    const level = Math.min(6, Math.floor(player.treats / 3));
    const growth = 1 + level * 0.055;
    groupRef.current.position.y = position[1] + bounce;
    const targetScale = growth * scale;
    const smoothedScale = groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * 0.085;
    groupRef.current.scale.setScalar(smoothedScale);
    groupRef.current.rotation.z = mood === "faint" ? -0.92 : mood === "sad" ? Math.sin(time * 4.1) * 0.07 : Math.sin(time * 1.4) * 0.025;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <Suspense fallback={<PetModel petId={player.petId} mood={mood} />}>
        <AssetPet petId={player.petId} mood={mood} />
      </Suspense>
      <GrowthCrown level={Math.min(6, Math.floor(player.treats / 3))} />
      <Treat mood={mood} />
    </group>
  );
}

function ToyStage({ position, scale = 1, accent = "#62c5d7" }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[1.48, 1.58, 0.2, 64]} />
        <meshStandardMaterial color="#e98972" roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[1.34, 1.42, 0.12, 64]} />
        <meshStandardMaterial color={accent} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.29, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.23, 0.045, 10, 64]} />
        <meshStandardMaterial color="#fff2cf" roughness={0.4} metalness={0.05} />
      </mesh>
      <RoundedBox args={[0.62, 0.1, 0.28]} radius={0.045} smoothness={3} position={[0, 0.3, -0.86]}>
        <meshStandardMaterial color="#f9c95f" roughness={0.48} />
      </RoundedBox>
    </group>
  );
}

function FoodBowl({ position, accent = "#e98972" }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.09, 0]} scale={[1, 0.62, 0.82]} castShadow>
        <sphereGeometry args={[0.34, 24, 16]} />
        <meshStandardMaterial color={accent} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.045, 8, 24]} />
        <meshStandardMaterial color="#fff2cf" roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.18, 0]} scale={[0.76, 0.24, 0.62]}>
        <sphereGeometry args={[0.22, 18, 12]} />
        <meshStandardMaterial color="#d59345" roughness={0.62} />
      </mesh>
    </group>
  );
}

function ToyRoom({ positions, twoPlayer }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#70b7c5" roughness={0.92} />
      </mesh>
      <mesh position={[0, 3.1, -3.45]} receiveShadow>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color="#96d2dc" roughness={0.98} />
      </mesh>
      <RoundedBox args={[1.8, 1.55, 0.35]} radius={0.14} smoothness={5} position={[-3.35, 1.15, -2.15]} castShadow>
        <meshStandardMaterial color="#e58a72" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[1.35, 0.72, 0.38]} radius={0.12} smoothness={5} position={[-3.35, 2.28, -2.08]} castShadow>
        <meshStandardMaterial color="#f5c75e" roughness={0.56} />
      </RoundedBox>
      <RoundedBox args={[1.4, 1.9, 0.34]} radius={0.14} smoothness={5} position={[3.32, 1.3, -2.15]} castShadow>
        <meshStandardMaterial color="#f3c766" roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.66, 0.42]} radius={0.11} smoothness={5} position={[3.32, 2.55, -2.05]} rotation={[0, 0, -0.08]} castShadow>
        <meshStandardMaterial color="#d96f68" roughness={0.56} />
      </RoundedBox>
      <mesh position={[-3.35, 1.9, -1.92]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.34, 0.08, 10, 22]} />
        <meshStandardMaterial color="#78c9d5" roughness={0.46} />
      </mesh>
      {positions.map((position, index) => (
        <group key={`stage-${index}`}>
          <ToyStage position={[position[0], 0, position[2]]} scale={twoPlayer ? 0.88 : 1.12} accent={index === 0 ? "#63c4d5" : "#8ccfba"} />
          <FoodBowl position={[position[0] + (twoPlayer ? (index === 0 ? 0.56 : -0.56) : 0.76), 0, position[2] + 1.02]} accent={index === 0 ? "#e98972" : "#d87880"} />
        </group>
      ))}
      <ContactShadows position={[0, 0.03, 0]} opacity={0.32} scale={9.5} blur={2.4} far={5.5} />
    </>
  );
}

function ShowcaseScene({ petIds, twoPlayer }) {
  const positions = twoPlayer ? [[-0.78, 0.25, 0.18], [0.78, 0.25, 0.18]] : [[0, 0.25, 0.18]];
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#75c3cf" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.7, -2.45]}>
        <planeGeometry args={[9, 5]} />
        <meshStandardMaterial color="#a7dce0" roughness={0.96} />
      </mesh>
      {positions.map((position, index) => (
        <group key={`showcase-pet-${index}`}>
          <ToyStage position={[position[0], 0, position[2]]} scale={twoPlayer ? 0.54 : 0.72} accent={index === 0 ? "#63c4d5" : "#8ccfba"} />
          <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.08}>
            <group position={[position[0], position[1], position[2]]} scale={twoPlayer ? 0.54 : 0.78}>
              <Suspense fallback={<PetModel petId={petIds[index]} mood="idle" />}>
                <AssetPet petId={petIds[index]} mood="idle" />
              </Suspense>
            </group>
          </Float>
        </group>
      ))}
    </>
  );
}

function ShowcaseCamera() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 1.08, 0);
  }, [camera]);

  return null;
}

function PetShowcase({ petIds, twoPlayer }) {
  return (
    <div className="pet-setup-showcase" aria-label="3D pet preview">
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        camera={{ position: [0, 1.55, 5.1], fov: 31 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#a7dce0"]} />
        <fog attach="fog" args={["#a7dce0", 4, 8]} />
        <ambientLight intensity={1.8} color="#fff4db" />
        <hemisphereLight intensity={1.25} color="#f5ffff" groundColor="#528b9b" />
        <directionalLight position={[-3, 5, 4]} intensity={3.1} color="#fff1c9" castShadow shadow-mapSize={[512, 512]} />
        <pointLight position={[2.5, 2.6, 2.6]} intensity={1.1} color="#ffd1aa" />
        <ShowcaseCamera />
        <ShowcaseScene petIds={petIds} twoPlayer={twoPlayer} />
      </Canvas>
      <span className="pet-showcase-label"><PawPrint size={13} /> Ready for a snack</span>
    </div>
  );
}

function PetWorld({ players, twoPlayer }) {
  const positions = twoPlayer ? [[-1.45, 0.24, 0.2], [1.45, 0.24, 0.2]] : [[0, 0.24, 0.2]];
  const scales = twoPlayer ? [0.86, 0.86] : [PET_SCALE];

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.6]}
      camera={{ position: [0, 2.85, 8.85], fov: 34 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#96d2dc"]} />
      <fog attach="fog" args={["#96d2dc", 8, 16]} />
      <ambientLight intensity={1.25} color="#fff3d5" />
      <hemisphereLight intensity={1.35} color="#f3ffff" groundColor="#4f8996" />
      <directionalLight position={[-4, 7, 5]} intensity={3.8} color="#fff0c4" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[4, 3, 2]} intensity={0.8} color="#ffc1a8" />
      <pointLight position={[0, 3.6, 3.5]} intensity={0.8} color="#d9f8ff" />
      <ToyRoom positions={positions} twoPlayer={twoPlayer} />
      {players.map((player, index) => (
        <PetActor key={player.id} player={player} position={positions[index]} scale={scales[index]} />
      ))}
      <Sparkles count={44} scale={[8, 3.4, 6]} size={2.4} speed={0.12} color="#fff4bf" opacity={0.42} />
    </Canvas>
  );
}

function HealthBar({ player, twoPlayer }) {
  const pet = getPet(player.petId);
  const value = Math.max(0, Math.round(player.health));
  const level = Math.min(6, Math.floor(player.treats / 3) + 1);
  const levelProgress = player.treats % 3;
  const mood = player.health <= 0 ? "fainted" : player.feedback?.type === "wrong" ? "needs a try" : "ready";
  return (
    <div className={`pet-health-card ${player.health <= 25 ? "is-low" : ""} ${twoPlayer ? "is-dual" : ""}`}>
      <div className="pet-health-card-top">
        <span className="pet-health-label"><span className="pet-color-dot" style={{ background: pet.color }} /> {twoPlayer ? player.label : pet.name}</span>
        <span className="pet-health-value"><HeartPulse size={14} /> {value}%</span>
      </div>
      <div className="pet-health-track" role="progressbar" aria-label={`${twoPlayer ? player.label : pet.name} health`} aria-valuenow={value} aria-valuemin="0" aria-valuemax="100">
        <span style={{ width: `${value}%` }} />
      </div>
      <div className="pet-health-card-bottom"><span>{pet.species}</span><span>{mood}</span></div>
      <div className="pet-growth-row">
        <span><Trophy size={12} /> Level {level}</span>
        <span>{level >= 6 ? "Max growth" : `${levelProgress}/3 treats`}</span>
      </div>
      <div className="pet-growth-track" role="progressbar" aria-label={`${pet.name} growth`} aria-valuenow={levelProgress} aria-valuemin="0" aria-valuemax="3">
        <span style={{ width: `${level >= 6 ? 100 : (levelProgress / 3) * 100}%` }} />
      </div>
    </div>
  );
}

function PetChoice({ pet, selected, onClick, label }) {
  return (
    <button className={`pet-choice ${selected ? "is-selected" : ""}`} type="button" onClick={onClick} aria-pressed={selected}>
      <span className="pet-choice-mark" style={{ background: pet.color }}><PawPrint size={20} strokeWidth={2.2} /></span>
      <span className="pet-choice-copy"><strong>{pet.name}</strong><small>{pet.species} / {pet.note}</small></span>
      {selected && <Check className="pet-choice-check" size={18} strokeWidth={3} />}
      {label && <span className="pet-choice-owner">{label}</span>}
    </button>
  );
}

function SetupScreen({ operation, settings, onChange, onStart }) {
  const meta = OPERATION_META[operation];
  return (
    <section className="pet-setup-screen" aria-labelledby="pet-setup-title">
      <div className="pet-setup-nav">
        <a className="pet-back-link" href="/" aria-label="Back to learning space"><ArrowLeft size={16} /> <span>Learning space</span></a>
        <span className="pet-operation-chip"><span>{meta.operator}</span> {meta.label}</span>
      </div>

      <div className="pet-setup-panel">
        <div className="pet-setup-heading">
          <div className="pet-setup-heading-copy">
            <p className="pet-eyebrow">PET FEEDING LAB</p>
            <h1 id="pet-setup-title">Feed a friend.</h1>
            <p>{meta.prompt} Choose a pet, pick a pace, and start the meadow.</p>
          </div>
          <div className="pet-setup-heading-art">
            <PetShowcase petIds={settings.petIds} twoPlayer={settings.twoPlayer} />
            <div className="pet-setup-equation" aria-label={`${meta.label} practice`}><span>?</span><b>{meta.operator}</b><span>?</span><b>=</b><strong><Utensils size={17} /></strong></div>
          </div>
        </div>

        <div className="pet-setup-sections">
          <section className="pet-setup-section pet-pet-section" aria-labelledby="pet-choice-title">
            <div className="pet-section-heading"><span className="pet-step">01</span><div><h2 id="pet-choice-title">Choose your pet</h2><p>{settings.twoPlayer ? "Each player picks a friend." : "Your friend is waiting."}</p></div></div>
            <div className={`pet-choice-groups ${settings.twoPlayer ? "is-dual" : ""}`}>
              {[0, ...(settings.twoPlayer ? [1] : [])].map((playerIndex) => (
                <div className="pet-choice-group" key={playerIndex}>
                  {settings.twoPlayer && <span className="pet-player-label"><Users size={14} /> Player {playerIndex + 1}</span>}
                  <div className="pet-choice-list">
                    {PETS.map((pet) => (
                      <PetChoice
                        key={pet.id}
                        pet={pet}
                        selected={settings.petIds[playerIndex] === pet.id}
                        onClick={() => onChange({ petIds: settings.petIds.map((id, index) => index === playerIndex ? pet.id : id) })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pet-setup-section" aria-labelledby="pet-difficulty-title">
            <div className="pet-section-heading"><span className="pet-step">02</span><div><h2 id="pet-difficulty-title">Choose difficulty</h2><p>The meadow gets hungrier at faster levels.</p></div></div>
            <div className="pet-difficulty-list">
              {DIFFICULTIES.map((difficulty) => (
                <button className={`pet-difficulty-choice ${difficulty.color} ${settings.difficultyId === difficulty.id ? "is-selected" : ""}`} type="button" key={difficulty.id} onClick={() => onChange({ difficultyId: difficulty.id })} aria-pressed={settings.difficultyId === difficulty.id}>
                  <span className="pet-difficulty-number">{difficulty.max}</span>
                  <span><strong>{difficulty.label}</strong><small>{difficulty.detail}</small></span>
                  {settings.difficultyId === difficulty.id && <Check size={17} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </section>

          <section className="pet-setup-section" aria-labelledby="pet-mode-title">
            <div className="pet-section-heading"><span className="pet-step">03</span><div><h2 id="pet-mode-title">Choose a mode</h2><p>Pick how long you want to care for your pet.</p></div></div>
            <div className="pet-mode-list">
              {GAME_MODES.map((mode) => (
                <button className={`pet-mode-choice ${settings.modeId === mode.id ? "is-selected" : ""}`} type="button" key={mode.id} onClick={() => onChange({ modeId: mode.id })} aria-pressed={settings.modeId === mode.id}>
                  <span className="pet-mode-icon"><ModeIcon modeId={mode.id} /></span>
                  <span><strong>{mode.label}</strong><small>{mode.detail}</small></span>
                  {settings.modeId === mode.id && <Check size={17} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="pet-setup-footer">
          <button className={`pet-two-player-toggle ${settings.twoPlayer ? "is-on" : ""}`} type="button" onClick={() => onChange({ twoPlayer: !settings.twoPlayer })} aria-pressed={settings.twoPlayer}>
            <span className="pet-toggle-icon"><Users size={18} /></span>
            <span><strong>{settings.twoPlayer ? "Two-player match on" : "Add a second player"}</strong><small>{settings.twoPlayer ? "Both pets share the meadow." : "Play side-by-side with answer lockouts."}</small></span>
            <span className="pet-toggle-track"><i /></span>
          </button>
          <button className="pet-start-button" type="button" onClick={onStart}><Play size={19} fill="currentColor" /> Start feeding</button>
        </div>
      </div>
    </section>
  );
}

function AnswerPanel({ player, operation, twoPlayer, isPaused, onAnswer }) {
  const meta = OPERATION_META[operation];
  const pet = getPet(player.petId);
  const disabled = isPaused || player.lockoutTicks > 0 || player.health <= 0;
  const feedbackType = player.feedback?.type;
  return (
    <section className={`pet-answer-panel ${feedbackType ? `has-${feedbackType}` : ""} ${player.lockoutTicks > 0 ? "is-locked" : ""}`} aria-label={`${player.label} answer area`}>
      <div className="pet-answer-heading">
        <span className="pet-answer-player"><span className="pet-answer-dot" style={{ background: pet.color }} /> {twoPlayer ? player.label : `${pet.name}'s turn`}</span>
        <span className="pet-answer-score"><Utensils size={13} /> {player.treats} treats</span>
      </div>
      <div className="pet-question" aria-live="polite"><strong>{player.question.first}</strong><span>{meta.operator}</span><strong>{player.question.second}</strong><span>=</span><em>?</em></div>
      <div className="pet-option-grid">
        {player.question.options.map((option, index) => {
          const isSelectedWrong = feedbackType === "wrong" && player.feedback.selectedAnswer === option;
          const isCorrectAnswer = feedbackType === "wrong" && player.feedback.correctAnswer === option;
          return (
            <button
              className={`pet-option ${isSelectedWrong ? "is-wrong" : ""} ${isCorrectAnswer ? "is-answer" : ""}`}
              type="button"
              key={`${player.question.id}-${option}`}
              onClick={() => onAnswer(player.id, option)}
              disabled={disabled}
              aria-label={`${player.label} answer option ${option}`}
            >
              <span className="pet-option-index">{index + 1}</span>{option}
            </button>
          );
        })}
      </div>
      <div className="pet-feedback-line" aria-live="polite">
        {feedbackType === "correct" && <><Smile size={16} /> Treat delivered. Keep going.</>}
        {feedbackType === "wrong" && <><Frown size={16} /> No treat this turn. The answer was {player.feedback.correctAnswer}.</>}
        {!feedbackType && player.lockoutTicks === 0 && <><PawPrint size={15} /> Choose the answer that keeps {pet.name} well.</>}
        {player.lockoutTicks > 0 && <><Clock size={15} /> Take a breath, then try the next one.</>}
      </div>
    </section>
  );
}

function GameOverScreen({ state, operation, onRestart, onChangeSettings }) {
  const winner = state.winnerId ? state.players.find((player) => player.id === state.winnerId) : null;
  const reason = state.gameOverReason === "time" ? "The meadow clock is done." : state.gameOverReason === "health" ? "A pet needs a proper rest." : "The round is complete.";
  return (
    <div className="pet-gameover-layer">
      <section className="pet-gameover-panel" role="dialog" aria-modal="true" aria-labelledby="pet-gameover-title">
        <div className="pet-gameover-icon">{winner ? <Trophy size={28} /> : <HeartPulse size={28} />}</div>
        <p className="pet-eyebrow">ROUND COMPLETE</p>
        <h2 id="pet-gameover-title">{winner ? `${winner.label} wins the meadow.` : state.twoPlayer ? "A close meadow match." : "Time to rest."}</h2>
        <p className="pet-gameover-copy">{reason}</p>
        <div className="pet-results-grid">
          {state.players.map((player) => {
            const pet = getPet(player.petId);
            return (
              <div className={`pet-result-row ${winner?.id === player.id ? "is-winner" : ""}`} key={player.id}>
                <span className="pet-result-name"><span className="pet-color-dot" style={{ background: pet.color }} /> {state.twoPlayer ? player.label : pet.name}</span>
                <strong>{player.score}</strong>
                <small>{player.treats} treats</small>
              </div>
            );
          })}
        </div>
        <div className="pet-gameover-actions">
          <button className="pet-secondary-button" type="button" onClick={onChangeSettings}><RotateCcw size={16} /> Change setup</button>
          <button className="pet-primary-button" type="button" onClick={onRestart}><Play size={16} fill="currentColor" /> Play again</button>
        </div>
      </section>
    </div>
  );
}

function PauseLayer({ onResume, onRestart, onChangeSettings }) {
  return (
    <div className="pet-pause-layer">
      <section className="pet-pause-panel" role="dialog" aria-modal="true" aria-labelledby="pet-pause-title">
        <div className="pet-gameover-icon"><Pause size={25} /></div>
        <p className="pet-eyebrow">MEADOW PAUSED</p>
        <h2 id="pet-pause-title">Your pet is waiting.</h2>
        <p>Take your time. The health bar stops here.</p>
        <div className="pet-pause-actions">
          <button className="pet-primary-button" type="button" onClick={onResume}><Play size={16} fill="currentColor" /> Continue</button>
          <button className="pet-secondary-button" type="button" onClick={onRestart}><RotateCcw size={16} /> Restart</button>
          <button className="pet-text-button" type="button" onClick={onChangeSettings}>Change setup</button>
        </div>
      </section>
    </div>
  );
}

function PetPlayScreen({ state, operation, isPaused, onPause, onAnswer, onRestart, onChangeSettings, soundEnabled, onToggleSound }) {
  const mode = getMode(state.modeId);
  const difficulty = getDifficulty(state.difficultyId);
  const questionNumber = Math.max(...state.players.map((player) => player.score + player.wrong)) + 1;
  return (
    <div className="pet-play-ui">
      <header className="pet-playbar">
        <a className="pet-back-link pet-play-back" href={OPERATION_META[operation].route === "/pet-feeding-addition" || OPERATION_META[operation].route === "/pet-feeding-subtraction" ? "/" : "/"} aria-label="Back to learning space"><ArrowLeft size={16} /> <span>Learning space</span></a>
        <div className="pet-play-title"><span className="pet-operation-chip"><span>{OPERATION_META[operation].operator}</span> {OPERATION_META[operation].label}</span><span className="pet-round-label">Round {String(questionNumber).padStart(2, "0")}</span></div>
        <div className="pet-play-actions">
          <button className="pet-icon-button" type="button" onClick={onToggleSound} aria-label={soundEnabled ? "Mute sound" : "Turn sound on"} title={soundEnabled ? "Mute sound" : "Turn sound on"}>{soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
          <button className="pet-icon-button" type="button" onClick={onPause} aria-label="Pause game" title="Pause game"><Pause size={17} /></button>
        </div>
      </header>

      <div className="pet-play-status">
        <div className="pet-health-stack">{state.players.map((player) => <HealthBar key={player.id} player={player} twoPlayer={state.twoPlayer} />)}</div>
        <div className={`pet-time-chip ${state.timeRemaining !== null && state.timeRemaining <= 10 ? "is-urgent" : ""}`}><span>{state.timeRemaining === null ? <HeartPulse size={15} /> : <Clock size={15} />}</span><strong>{formatTime(state.timeRemaining)}</strong><small>{mode.label} / {difficulty.label}</small></div>
      </div>

      <div className="pet-answer-wrap"><div className={`pet-answer-dock ${state.twoPlayer ? "is-dual" : ""}`}>{state.players.map((player) => <AnswerPanel key={player.id} player={player} operation={operation} twoPlayer={state.twoPlayer} isPaused={isPaused} onAnswer={onAnswer} />)}</div></div>

      {isPaused && <PauseLayer onResume={onPause} onRestart={onRestart} onChangeSettings={onChangeSettings} />}
      {state.phase === "gameover" && <GameOverScreen state={state} operation={operation} onRestart={onRestart} onChangeSettings={onChangeSettings} />}
    </div>
  );
}

export default function PetFeedingGame({ operation = "addition" }) {
  const [settings, setSettings] = useState({
    difficultyId: "within-10",
    modeId: "practice",
    twoPlayer: false,
    petIds: ["cat", "bunny"]
  });
  const [gameState, setGameState] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef(null);
  const wrongTimersRef = useRef([]);

  const scenePlayers = useMemo(() => gameState?.players || settings.petIds.slice(0, settings.twoPlayer ? 2 : 1).map((petId, index) => ({
    id: `preview-${index}`,
    petId,
    health: 100,
    feedback: null
  })), [gameState, settings.petIds, settings.twoPlayer]);

  useEffect(() => () => {
    wrongTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    if (audioContextRef.current && audioContextRef.current.state !== "closed") audioContextRef.current.close();
  }, []);

  useEffect(() => {
    if (!gameState || gameState.phase !== "playing" || isPaused) return undefined;
    const timer = window.setInterval(() => setGameState((current) => tickSession(current)), 1000);
    return () => window.clearInterval(timer);
  }, [gameState?.phase, isPaused]);

  function playFeedbackSound(result) {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContextRef.current) audioContextRef.current = new AudioContextClass();
    const context = audioContextRef.current;
    if (context.state === "suspended") context.resume();
    if (result === "correct") {
      softTone(context, 523.25, 0.16, "triangle", 0.07);
      window.setTimeout(() => softTone(context, 783.99, 0.22, "triangle", 0.055), 100);
    } else if (result === "wrong") {
      softTone(context, 160, 0.2, "sine", 0.045);
    }
  }

  function startGame() {
    setGameState(createSession({ operation, ...settings }));
    setIsPaused(false);
  }

  function answer(playerId, selectedAnswer) {
    if (isPaused || !gameState) return;
    const outcome = answerSession(gameState, playerId, selectedAnswer);
    if (outcome.result === "inactive" || outcome.result === "locked") return;
    setGameState(outcome.state);
    playFeedbackSound(outcome.result);
    if (outcome.result === "wrong") {
      const timer = window.setTimeout(() => setGameState((current) => advanceAfterWrong(current, playerId, outcome.token)), 1100);
      wrongTimersRef.current.push(timer);
    }
  }

  useEffect(() => {
    if (!gameState || gameState.phase !== "playing") return undefined;
    function handleKeyDown(event) {
      if (isPaused) return;
      const key = event.key.toLowerCase();
      const mappings = gameState.twoPlayer
        ? [{ id: "player-1", keys: ["1", "2", "3", "4"] }, { id: "player-2", keys: ["q", "w", "e", "r"] }]
        : [{ id: "player-1", keys: ["1", "2", "3", "4"] }];
      const mapping = mappings.find((entry) => entry.keys.includes(key));
      if (!mapping) return;
      const player = gameState.players.find((entry) => entry.id === mapping.id);
      const optionIndex = mapping.keys.indexOf(key);
      if (!player || optionIndex < 0 || optionIndex >= player.question.options.length) return;
      event.preventDefault();
      answer(mapping.id, player.question.options[optionIndex]);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, isPaused]);

  function restartGame() {
    startGame();
  }

  function changeSettings() {
    setGameState(null);
    setIsPaused(false);
  }

  return (
    <main className={`pet-game pet-game-${operation}`}>
      <div className="pet-canvas-layer" aria-hidden="true"><PetWorld players={scenePlayers} twoPlayer={gameState?.twoPlayer ?? settings.twoPlayer} /></div>
      {!gameState && <SetupScreen operation={operation} settings={settings} onChange={(next) => setSettings((current) => ({ ...current, ...next }))} onStart={startGame} />}
      {gameState && <PetPlayScreen state={gameState} operation={operation} isPaused={isPaused} onPause={() => setIsPaused((current) => !current)} onAnswer={answer} onRestart={restartGame} onChangeSettings={changeSettings} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled((current) => !current)} />}
    </main>
  );
}
