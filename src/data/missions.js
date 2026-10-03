import { BookOpen, Calculator, Flag, Footprints, Sparkles } from "lucide-react";

export const MISSION_LIBRARY = [
  {
    id: "huruf",
    tracks: ["bm", "both"],
    title: "Peta Huruf",
    english: "Letter map",
    description: "Padankan huruf besar dan huruf kecil.",
    route: "/murid/bahasa-melayu?mission=huruf",
    Icon: BookOpen,
    color: "coral"
  },
  {
    id: "tambah",
    tracks: ["math", "both"],
    title: "Jambatan Tambah",
    english: "Addition bridge",
    description: "Bina nombor, regroup dan cari jawapan.",
    route: "/addition-regroup?mission=tambah",
    Icon: Calculator,
    color: "blue"
  },
  {
    id: "suku-kata",
    tracks: ["bm", "both"],
    title: "Laluan Suku Kata",
    english: "Syllable trail",
    description: "Dengar bunyi KV dan lompat ke jawapan.",
    route: "/kv-sound-pond?mission=suku-kata",
    Icon: Footprints,
    color: "mint"
  },
  {
    id: "darab",
    tracks: ["math", "both"],
    title: "Puncak Darab",
    english: "Multiplication peak",
    description: "Lindungi otak dengan fakta darab.",
    route: "/zombie-defense?op=darab&mission=darab",
    Icon: Flag,
    color: "lemon"
  }
];

export function getMissionsForTrack(track) {
  return MISSION_LIBRARY.filter((mission) => mission.tracks.includes(track || "both"));
}

export function getMissionById(missionId) {
  return MISSION_LIBRARY.find((mission) => mission.id === missionId) || null;
}

export function missionIconForState(state) {
  if (state === "complete") return Sparkles;
  return state === "locked" ? Footprints : Flag;
}
