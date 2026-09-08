// Generated image slots are kept in one place so the visual asset pack can be swapped in later.
export const APP_IMAGES = {
  studentWelcome: "/images/home/student-welcome.webp",
  teacherWelcome: "/images/home/teacher-welcome.webp",
  bahasaMelayu: "/images/home/bahasa-melayu.webp",
  matematik: "/images/home/matematik.webp",
  bahasaMelayu3d: "/images/home/bahasa-melayu-3d.jpg",
  matematik3d: "/images/home/matematik-3d.jpg",
  learningSpace: "/images/home/learning-space-3d.jpg",
  pattern: "/images/home/pattern-3d.jpg",
  belajar: "/images/home/belajar-3d.jpg",
  main: "/images/home/main-3d.jpg",
  ujiDiri: "/images/home/uji-diri-3d.jpg"
};

const AVATAR_OPTIONS = [
  { id: "bintang", label: "Bintang", mark: "⭐", color: "lemon" },
  { id: "awan", label: "Awan", mark: "☁️", color: "blue" },
  { id: "pelangi", label: "Pelangi", mark: "🌈", color: "coral" },
  { id: "daun", label: "Daun", mark: "🍃", color: "mint" },
  { id: "singa", label: "Singa", mark: "🦁", color: "lemon" },
  { id: "robot", label: "Robot", mark: "🤖", color: "blue" },
  { id: "angkasa", label: "Angkasa", mark: "🚀", color: "coral" },
  { id: "kucing", label: "Kucing", mark: "🐱", color: "mint" },
  { id: "anjing", label: "Anjing", mark: "🐶", color: "blue" },
  { id: "beruang", label: "Beruang", mark: "🐻", color: "coral" },
  { id: "monyet", label: "Monyet", mark: "🐵", color: "lemon" },
  { id: "ayam", label: "Ayam", mark: "🐥", color: "mint" },
  { id: "ikan", label: "Ikan", mark: "🐟", color: "blue" },
  { id: "rama-rama", label: "Rama-rama", mark: "🦋", color: "coral" },
  { id: "lebah", label: "Lebah", mark: "🐝", color: "lemon" },
  { id: "dinosaur", label: "Dinosaur", mark: "🦖", color: "mint" },
  { id: "paus", label: "Paus", mark: "🐳", color: "blue" },
  { id: "matahari", label: "Matahari", mark: "☀️", color: "lemon" },
  { id: "bunga", label: "Bunga", mark: "🌸", color: "coral" },
  { id: "epal", label: "Epal", mark: "🍎", color: "mint" },
  { id: "pensel", label: "Pensel", mark: "✏️", color: "blue" },
  { id: "roket", label: "Roket", mark: "🛸", color: "coral" },
  { id: "bola", label: "Bola", mark: "⚽", color: "lemon" }
];

export const AVATARS = AVATAR_OPTIONS.map((avatar) => ({
  ...avatar,
  image: `/images/avatars/${avatar.id}.png`
}));
