export const BM_CATEGORIES = [
  {
    id: "huruf",
    title: "Huruf",
    subtitle: "Letters",
    description: "Kenal dan bunyi 26 huruf",
    color: "coral",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Belajar bunyi huruf" },
      { id: "main", title: "Main", description: "Permainan huruf" },
      { id: "ujian", title: "Ujian", description: "Uji diri" }
    ]
  },
  {
    id: "vokal",
    title: "Vokal",
    subtitle: "Vowels",
    description: "Bunyi a, e, i, o, u",
    color: "lemon",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Kenal bunyi vokal" },
      { id: "main", title: "Main", description: "Permainan bunyi haiwan" },
      { id: "ujian", title: "Ujian", description: "Uji sebutan vokal" }
    ]
  },
  {
    id: "suku-kata",
    title: "Suku Kata",
    subtitle: "Syllables",
    description: "KV, KVK, dan bunyi bergabung",
    color: "mint",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Pilih KV atau KVK" },
      { id: "main", title: "Main", description: "Lompat Si Katak Lompat" },
      { id: "ujian", title: "Ujian", description: "Uji sebutan KV dan KVK" }
    ]
  },
  {
    id: "perkataan",
    title: "Perkataan",
    subtitle: "Words",
    description: "Bina dan kenal perkataan",
    color: "blue",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Kenal perkataan" },
      { id: "main", title: "Main", description: "Kuiz 4 pilihan" },
      { id: "ujian", title: "Ulang kaji", description: "Ulang kaji kad imbas" }
    ]
  }
];

export const SYLLABLE_FAMILIES = [
  { id: "kv", title: "KV", subtitle: "bunyi asas", example: "ba · be · bi · bo · bu", color: "mint" },
  { id: "kvk", title: "KVK", subtitle: "pintu yang sudah siap", example: "bas · jam · tin", color: "coral" },
  { id: "kvkk", title: "KVKK", subtitle: "bunyi bergabung", example: "bank · lamp", color: "lemon" },
  { id: "diftong", title: "Diftong", subtitle: "dua bunyi jadi satu", example: "ai · au · oi", color: "blue" },
  { id: "digraf", title: "Digraf", subtitle: "dua huruf satu bunyi", example: "ng · ny · sy · kh", color: "lilac" }
];

export const WORD_LEVELS = [
  { number: 1, title: "Mula kenal", subtitle: "Padan benda mudah", color: "mint", skills: ["KV terbuka", "Kata nama biasa", "Satu suku kata", "Padan gambar jelas"] },
  { number: 2, title: "Sudah kenal", subtitle: "Bina perkataan", color: "coral", skills: ["KVK mudah", "Diftong awal", "Digraf awal", "Dua suku kata"] },
  { number: 3, title: "Makin yakin", subtitle: "Pilih makna tepat", color: "lemon", skills: ["Kata majmuk", "Imbuhan mudah", "Kata berulang", "Pilih ejaan"] },
  { number: 4, title: "Juara perkataan", subtitle: "Cabaran ayat pendek", color: "blue", skills: ["Baca ayat pendek", "Pilih gambar", "Lengkapkan ayat", "Faham konteks"] }
];

export const HURUF_DETAILS = [
  ["A", "a", "ayam", ["a", "ay", "ei"]], ["B", "be", "bola", ["b", "be", "bee"]],
  ["C", "ce", "cawan", ["c", "ce", "si", "see"]], ["D", "de", "dadu", ["d", "de", "di", "dee"]],
  ["E", "e", "epal", ["e", "i"]], ["F", "ef", "feri", ["f", "ef"]],
  ["G", "je", "gajah", ["g", "je", "gee"]], ["H", "ha", "harimau", ["h", "ha", "aitch"]],
  ["I", "i", "ikan", ["i", "ee"]], ["J", "je", "jam", ["j", "je", "jay"]],
  ["K", "ke", "kereta", ["k", "ke", "kay"]], ["L", "el", "lampu", ["l", "el"]],
  ["M", "em", "mata", ["m", "em"]], ["N", "en", "nasi", ["n", "en"]],
  ["O", "o", "oren", ["o", "oh"]], ["P", "pe", "pisang", ["p", "pe", "pee"]],
  ["Q", "kiu", "qari", ["q", "kiu", "cue"]], ["R", "ar", "rumah", ["r", "ar"]],
  ["S", "es", "sudu", ["s", "es"]], ["T", "te", "topi", ["t", "te", "tee"]],
  ["U", "u", "ular", ["u", "you"]], ["V", "ve", "van", ["v", "ve"]],
  ["W", "dabliu", "wau", ["w", "dabliu", "doubleyou"]], ["X", "eks", "x-ray", ["x", "eks"]],
  ["Y", "wai", "yo-yo", ["y", "wai", "why"]], ["Z", "zet", "zebra", ["z", "zet", "zee"]]
].map(([letter, sound, word, accepted]) => ({ letter, sound, word, accepted }));

export const HURUF = HURUF_DETAILS;

export const VOKAL = [
  { id: "a", label: "a", sound: "a", audioPath: "/audio/vowels/a.mp3" },
  { id: "e-pepet", label: "e", variant: "pepet", sound: "e", audioPath: "/audio/vowels/e-pepet.mp3" },
  { id: "e-taling", label: "e", variant: "taling", sound: "e", audioPath: "/audio/vowels/e-taling.mp3" },
  { id: "i", label: "i", sound: "i", audioPath: "/audio/vowels/i.mp3" },
  { id: "o", label: "o", sound: "o", audioPath: "/audio/vowels/o.mp3" },
  { id: "u", label: "u", sound: "u", audioPath: "/audio/vowels/u.mp3" }
];
