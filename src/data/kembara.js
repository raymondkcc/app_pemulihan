export const WHATSAPP_LINK = "https://wa.link/nin7zx";
export const WHATSAPP_PREFILL = "Saya mahu akaun percuma Kembara Pintar. Nama: ____. Saya cikgu / ibu bapa. Sekolah: ____.";
export const FREE_STUDENT_LIMIT = 10;
export const CLASS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const GUEST_DEMO_PATHS = ["/murid/ruang", "/murid/bahasa-melayu", "/addition-regroup"];

export const TRACKS = [
  { id: "bm", title: "Bacaan", english: "Malay only", helper: "Huruf, suku kata, perkataan" },
  { id: "math", title: "Kira", english: "Maths only", helper: "Tambah, tolak, kira" },
  { id: "both", title: "Kembara", english: "Malay + Maths", helper: "Dua-dua subjek" }
];

export const LOCK_PICTURES = [
  { id: "ayam", word: "ayam", image: "/images/perkataan/ayam.png" },
  { id: "kucing", word: "kucing", image: "/images/perkataan/kucing.png" },
  { id: "ikan", word: "ikan", image: "/images/perkataan/ikan.png" },
  { id: "bola", word: "bola", image: "/images/perkataan/bola.png" },
  { id: "bas", word: "bas", image: "/images/perkataan/bas.png" },
  { id: "buku", word: "buku", image: "/images/perkataan/buku.png" }
];

export const RATE_LIMIT_COPY = {
  child: {
    bm: "Tunggu sekejap. Jangan tekan terlalu kerap.",
    en: "Wait a little. Too many taps.",
    audio: "Tunggu sekejap ya."
  },
  adult: {
    bm: "Operasi terlalu kerap. Perlahankan operasi.",
    en: "Too many operations. Slow down."
  }
};

export function trackLabel(track) {
  return TRACKS.find((item) => item.id === track) || TRACKS[2];
}

export function demoHrefForTrack(track) {
  if (track === "math") return "/addition-regroup";
  return "/murid/bahasa-melayu";
}
