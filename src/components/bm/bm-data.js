const BM_CATEGORIES = [
  {
    id: "huruf",
    title: "Huruf",
    subtitle: "Letters",
    description: "Kenal dan bunyi 26 huruf",
    color: "coral",
    icon: "PenLine",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Belajar bunyi huruf", component: "huruf-belajar" },
      { id: "main", title: "Main", description: "Permainan huruf", component: "huruf-main" },
      { id: "ujian", title: "Ujian", description: "Uji diri", component: "huruf-ujian" }
    ]
  },
  {
    id: "vokal",
    title: "Vokal",
    subtitle: "Vowels",
    description: "Bunyi a e i o u",
    color: "lemon",
    icon: "Volume2",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Kenal bunyi vokal", component: "vokal-belajar" },
      { id: "main", title: "Main", description: "Permainan bunyi haiwan", component: "vokal-main" },
      { id: "ujian", title: "Ujian", description: "Uji sebutan vokal", component: "vokal-ujian" }
    ]
  },
  {
    id: "suku-kata",
    title: "Suku Kata",
    subtitle: "Syllables",
    description: "KV, KVK, dan bunyi bergabung",
    color: "mint",
    icon: "BookOpen",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Jadual bunyi KV", component: "suku-belajar" },
      { id: "main", title: "Main", description: "Lompat Si Katak Lompat", component: "suku-main" },
      { id: "ujian", title: "Ujian", description: "Pintu KVK", component: "suku-ujian" }
    ]
  },
  {
    id: "perkataan",
    title: "Perkataan",
    subtitle: "Words",
    description: "Bina dan kenal perkataan",
    color: "blue",
    icon: "Languages",
    subCategories: [
      { id: "belajar", title: "Belajar", description: "Kenal perkataan", component: "perkataan-belajar" },
      { id: "main", title: "Main", description: "Kuiz 4 pilihan", component: "perkataan-main" },
      { id: "ujian", title: "Ulang kaji", description: "Ulang kaji kad imbas", component: "perkataan-ujian" }
    ]
  }
];

const SYLLABLE_FAMILIES = [
  { id: "kv", title: "KV", subtitle: "bunyi asas", example: "ba · be · bi · bo · bu", live: true, color: "mint" },
  { id: "kvk", title: "KVK", subtitle: "pintu yang sudah siap", example: "bas · jam · tin", live: true, color: "coral" },
  { id: "kvkk", title: "KVKK", subtitle: "bunyi bergabung", example: "bank · lamp", live: false, color: "lemon" },
  { id: "diftong", title: "Diftong", subtitle: "dua bunyi jadi satu", example: "ai · au · oi", live: false, color: "blue" },
  { id: "digraf", title: "Digraf", subtitle: "dua huruf satu bunyi", example: "ng · ny · sy · kh", live: false, color: "lilac" }
];

const WORD_LEVELS = [
  { number: 1, title: "Mula kenal", subtitle: "Padan benda mudah", color: "mint", skills: ["KV terbuka", "Kata nama biasa", "Satu suku kata", "Padan gambar jelas", "Vokal awal", "Bunyi akhir", "Kata di rumah", "Kata di kelas"] },
  { number: 2, title: "Sudah kenal", subtitle: "Bina perkataan", color: "coral", skills: ["KVK mudah", "Diftong awal", "Digraf awal", "Dua suku kata", "Kata kerja mudah", "Kata sifat mudah", "Padan pasangan", "Cari huruf hilang"] },
  { number: 3, title: "Makin yakin", subtitle: "Pilih makna tepat", color: "lemon", skills: ["Kata majmuk", "Imbuhan mudah", "Kata berulang", "Diftong tengah", "Digraf tengah", "Kata ikut tema", "Gambar bersiri", "Pilih ejaan"] },
  { number: 4, title: "Juara perkataan", subtitle: "Cabaran ayat pendek", color: "blue", skills: ["Baca ayat pendek", "Pilih gambar", "Lengkapkan ayat", "Kata berimbuhan", "Kata hubung", "Susun perkataan", "Faham konteks", "Campur semua bunyi"] }
];

const MATH_OPERATIONS = [
  { id: "tambah", title: "Operasi tambah", english: "Addition", symbol: "+", helper: "Gabung nombor", color: "coral", Icon: Plus, href: "/addition-regroup" },
  { id: "tolak", title: "Operasi tolak", english: "Subtraction", symbol: "-", helper: "Ambil dan kira", color: "mint", Icon: Minus, href: "/minus-regroup" },
  { id: "darab", title: "Operasi darab", english: "Multiplication", symbol: "x", helper: "Kumpulan sama banyak", color: "lemon", Icon: Star, href: "/mosquito-splat?op=darab" },
  { id: "bahagi", title: "Operasi bahagi", english: "Division", symbol: "÷", helper: "Kongsi sama rata", color: "blue", Icon: Calculator }
];

const HURUF = [
  { letter: "A", sound: "a", word: "ayam", emoji: "\u{1F414}", accepted: ["a", "ay", "ei"] },
  { letter: "B", sound: "be", word: "bola", emoji: "\u{26BD}", accepted: ["b", "be", "bee"] },
  { letter: "C", sound: "ce", word: "cawan", emoji: "\u{1F375}", accepted: ["c", "ce", "si", "see"] },
  { letter: "D", sound: "de", word: "dadu", emoji: "\u{1F3B2}", accepted: ["d", "de", "di", "dee"] },
  { letter: "E", sound: "e", word: "epal", emoji: "\u{1F34E}", accepted: ["e", "i"] },
  { letter: "F", sound: "ef", word: "feri", emoji: "\u{26F4}", accepted: ["f", "ef"] },
  { letter: "G", sound: "je", word: "gajah", emoji: "\u{1F418}", accepted: ["g", "je", "gee"] },
  { letter: "H", sound: "ha", word: "harimau", emoji: "\u{1F42F}", accepted: ["h", "ha", "aitch"] },
  { letter: "I", sound: "i", word: "ikan", emoji: "\u{1F41F}", accepted: ["i", "ee"] },
  { letter: "J", sound: "je", word: "jam", emoji: "\u{23F0}", accepted: ["j", "je", "jay"] },
  { letter: "K", sound: "ke", word: "kereta", emoji: "\u{1F697}", accepted: ["k", "ke", "kay"] },
  { letter: "L", sound: "el", word: "lampu", emoji: "\u{1F4A1}", accepted: ["l", "el"] },
  { letter: "M", sound: "em", word: "mata", emoji: "\u{1F441}", accepted: ["m", "em"] },
  { letter: "N", sound: "en", word: "nasi", emoji: "\u{1F35A}", accepted: ["n", "en"] },
  { letter: "O", sound: "o", word: "oren", emoji: "\u{1F34A}", accepted: ["o", "oh"] },
  { letter: "P", sound: "pe", word: "pisang", emoji: "\u{1F34C}", accepted: ["p", "pe", "pee"] },
  { letter: "Q", sound: "kiu", word: "qari", emoji: "\u{1F4D6}", accepted: ["q", "kiu", "cue"] },
  { letter: "R", sound: "ar", word: "rumah", emoji: "\u{1F3E0}", accepted: ["r", "ar"] },
  { letter: "S", sound: "es", word: "sudu", emoji: "\u{1F944}", accepted: ["s", "es"] },
  { letter: "T", sound: "te", word: "topi", emoji: "\u{1F3A9}", accepted: ["t", "te", "tee"] },
  { letter: "U", sound: "u", word: "ular", emoji: "\u{1F40D}", accepted: ["u", "you"] },
  { letter: "V", sound: "ve", word: "van", emoji: "\u{1F69A}", accepted: ["v", "ve"] },
  { letter: "W", sound: "dabliu", word: "wau", emoji: "\u{1FA81}", accepted: ["w", "dabliu", "double you"] },
  { letter: "X", sound: "eks", word: "x-ray", emoji: "\u{1F50D}", accepted: ["x", "eks"] },
  { letter: "Y", sound: "wai", word: "yo-yo", emoji: "\u{1FA80}", accepted: ["y", "wai", "why"] },
  { letter: "Z", sound: "zet", word: "zebra", emoji: "\u{1F993}", accepted: ["z", "zet", "zee"] }
];

const makeStrokeLesson = (paths, steps) => ({ paths, steps });

const MANUSCRIPT_STROKES = {
  capital: {
    A: makeStrokeLesson(["M 48 168 L 98 32", "M 98 32 L 150 168", "M 70 112 L 128 112"], ["Serong turun", "Serong naik", "Palang tengah"]),
    B: makeStrokeLesson(["M 54 168 L 54 32", "M 54 34 C 142 18 144 84 58 92", "M 58 92 C 154 76 158 170 54 166"], ["Garis turun", "Bulat atas", "Bulat bawah"]),
    C: makeStrokeLesson(["M 148 58 C 112 16 54 30 45 96 C 36 160 112 184 150 138"], ["Mula atas, pusing dan tutup bawah"]),
    D: makeStrokeLesson(["M 54 168 L 54 32", "M 55 34 C 166 18 170 174 55 166"], ["Garis turun", "Bulat besar ke bawah"]),
    E: makeStrokeLesson(["M 52 32 L 52 168", "M 52 32 L 150 32", "M 52 100 L 130 100", "M 52 168 L 150 168"], ["Garis turun", "Palang atas", "Palang tengah", "Palang bawah"]),
    F: makeStrokeLesson(["M 52 168 L 52 32", "M 52 32 L 150 32", "M 52 100 L 130 100"], ["Garis turun", "Palang atas", "Palang tengah"]),
    G: makeStrokeLesson(["M 150 58 C 114 15 54 30 45 96 C 38 160 116 184 154 130", "M 154 105 L 105 105"], ["Bentuk bulat", "Masuk palang"]),
    H: makeStrokeLesson(["M 52 32 L 52 168", "M 148 32 L 148 168", "M 52 100 L 148 100"], ["Garis kiri", "Garis kanan", "Palang tengah"]),
    I: makeStrokeLesson(["M 50 32 L 150 32", "M 100 32 L 100 168", "M 50 168 L 150 168"], ["Palang atas", "Garis turun", "Palang bawah"]),
    J: makeStrokeLesson(["M 50 32 L 150 32", "M 130 32 L 130 135 C 130 178 54 180 50 130"], ["Palang atas", "Garis turun dan lengkung"]),
    K: makeStrokeLesson(["M 52 32 L 52 168", "M 52 104 L 148 32", "M 52 104 L 148 168"], ["Garis turun", "Serong atas", "Serong bawah"]),
    L: makeStrokeLesson(["M 52 32 L 52 168", "M 52 168 L 150 168"], ["Garis turun", "Garis bawah"]),
    M: makeStrokeLesson(["M 48 168 L 48 32 L 100 112 L 152 32 L 152 168"], ["Satu garisan bersambung"]),
    N: makeStrokeLesson(["M 52 168 L 52 32", "M 52 32 L 148 168", "M 148 168 L 148 32"], ["Garis kiri", "Serong turun", "Garis kanan"]),
    O: makeStrokeLesson(["M 100 30 C 38 30 38 170 100 170 C 162 170 162 30 100 30"], ["Pusing bulat tanpa putus"]),
    P: makeStrokeLesson(["M 54 168 L 54 32", "M 54 34 C 154 18 154 100 54 96"], ["Garis turun", "Bulat atas"]),
    Q: makeStrokeLesson(["M 100 30 C 38 30 38 170 100 170 C 162 170 162 30 100 30", "M 110 128 L 158 174"], ["Pusing bulat", "Tarik ekor"]),
    R: makeStrokeLesson(["M 54 168 L 54 32", "M 54 34 C 154 18 154 100 54 96", "M 92 96 L 150 168"], ["Garis turun", "Bulat atas", "Serong kaki"]),
    S: makeStrokeLesson(["M 148 48 C 118 16 55 28 50 70 C 45 104 145 100 150 140 C 154 176 76 186 46 144"], ["Pusing dari atas ke bawah"]),
    T: makeStrokeLesson(["M 45 32 L 155 32", "M 100 32 L 100 168"], ["Palang atas", "Garis tengah"]),
    U: makeStrokeLesson(["M 52 32 L 52 125 C 52 184 148 184 148 125 L 148 32"], ["Turun, pusing dan naik"]),
    V: makeStrokeLesson(["M 45 32 L 100 168 L 155 32"], ["Serong turun dan serong naik"]),
    W: makeStrokeLesson(["M 38 32 L 70 168 L 100 90 L 130 168 L 162 32"], ["Empat serong bersambung"]),
    X: makeStrokeLesson(["M 48 32 L 152 168", "M 152 32 L 48 168"], ["Serong turun", "Serong silang"]),
    Y: makeStrokeLesson(["M 48 32 L 100 98 L 152 32", "M 100 98 L 100 168"], ["Dua serong bertemu", "Garis turun"]),
    Z: makeStrokeLesson(["M 48 32 L 152 32", "M 152 32 L 48 168", "M 48 168 L 152 168"], ["Palang atas", "Serong turun", "Palang bawah"])
  },
  small: {
    A: makeStrokeLesson(["M 50 130 C 50 74 142 74 142 130", "M 50 130 C 50 166 142 166 142 130", "M 142 78 L 142 166"], ["Bulat kecil", "Tutup bulat", "Garis akhir"]),
    B: makeStrokeLesson(["M 58 168 L 58 32", "M 58 96 C 150 72 150 168 58 154"], ["Garis turun", "Bulat bawah"]),
    C: makeStrokeLesson(["M 146 92 C 112 62 54 72 50 122 C 46 166 108 174 146 142"], ["Bulat terbuka"]),
    D: makeStrokeLesson(["M 142 32 L 142 166", "M 142 96 C 50 72 50 168 142 150"], ["Garis tinggi", "Bulat bawah"]),
    E: makeStrokeLesson(["M 52 128 C 80 128 120 128 146 106 C 124 70 54 76 50 126 C 48 168 110 178 148 148"], ["Bulat dengan palang"]),
    F: makeStrokeLesson(["M 118 42 C 78 14 66 56 66 96 L 66 168", "M 42 92 L 108 92"], ["Lengkung dan turun", "Palang kecil"]),
    G: makeStrokeLesson(["M 146 94 C 110 62 54 76 52 124 C 50 170 120 174 142 140", "M 142 118 L 104 118 L 104 174"], ["Bulat", "Turun ekor"]),
    H: makeStrokeLesson(["M 58 32 L 58 168", "M 58 110 C 90 78 142 82 142 122 L 142 168"], ["Garis tinggi", "Bahu dan turun"]),
    I: makeStrokeLesson(["M 84 92 L 84 168", "M 84 58 L 84 58"], ["Garis turun", "Titik"]),
    J: makeStrokeLesson(["M 112 92 L 112 166 C 112 190 52 190 52 150", "M 112 58 L 112 58"], ["Garis turun dan lengkung", "Titik"]),
    K: makeStrokeLesson(["M 60 32 L 60 168", "M 60 124 L 132 84", "M 60 124 L 132 168"], ["Garis tinggi", "Serong atas", "Serong bawah"]),
    L: makeStrokeLesson(["M 92 32 L 92 168"], ["Satu garis turun"]),
    M: makeStrokeLesson(["M 44 168 L 44 96 C 44 76 78 76 92 108 C 108 76 148 76 148 108 L 148 168"], ["Turun, dua bahu, turun"]),
    N: makeStrokeLesson(["M 52 168 L 52 100 C 52 76 142 76 142 112 L 142 168"], ["Turun, bahu, turun"]),
    O: makeStrokeLesson(["M 100 82 C 44 82 44 170 100 170 C 156 170 156 82 100 82"], ["Pusing bulat kecil"]),
    P: makeStrokeLesson(["M 58 210 L 58 96 C 58 76 142 76 142 118 C 142 156 58 150 58 118"], ["Garis turun", "Bulat dan ekor bawah"]),
    Q: makeStrokeLesson(["M 100 82 C 44 82 44 170 100 170 C 156 170 156 82 100 82", "M 112 140 L 150 190"], ["Pusing bulat", "Tarik ekor"]),
    R: makeStrokeLesson(["M 58 168 L 58 96 C 58 76 142 76 142 118 C 142 142 102 150 78 132"], ["Turun dan bahu"]),
    S: makeStrokeLesson(["M 142 94 C 124 70 58 74 54 112 C 50 148 134 130 142 164 C 148 194 78 188 52 162"], ["Pusing kecil dari atas"]),
    T: makeStrokeLesson(["M 54 88 L 138 88", "M 96 44 L 96 168"], ["Palang", "Garis turun"]),
    U: makeStrokeLesson(["M 54 92 L 54 140 C 54 180 142 180 142 140 L 142 92"], ["Turun, pusing dan naik"]),
    V: makeStrokeLesson(["M 52 94 L 96 168 L 142 94"], ["Serong turun dan naik"]),
    W: makeStrokeLesson(["M 40 94 L 66 168 L 96 112 L 126 168 L 154 94"], ["Serong berganda"]),
    X: makeStrokeLesson(["M 54 94 L 142 168", "M 142 94 L 54 168"], ["Serong turun", "Serong silang"]),
    Y: makeStrokeLesson(["M 52 94 L 98 132 L 144 94", "M 98 132 L 98 194"], ["Dua serong bertemu", "Ekor turun"]),
    Z: makeStrokeLesson(["M 54 94 L 144 94", "M 144 94 L 54 168", "M 54 168 L 144 168"], ["Palang atas", "Serong turun", "Palang bawah"])
  }
};

const BM_MODULES = [
  { id: "huruf", title: "Huruf", english: "Letters", description: "Kenal bentuk, bunyi dan cara menulis huruf.", sample: "A a", color: "coral", Icon: PenLine },
  { id: "vokal", title: "Vokal", english: "Vowels", description: "Dengar bunyi a, e pepet, e taling, i, o dan u dalam Bahasa Melayu.", sample: "a e-pepet e-taling", color: "lemon", Icon: Volume2 },
  { id: "kv", title: "KV", english: "Open syllables", description: "Dengar vokal dan baca ba, be, bi, bo dan bu.", sample: "ba be bi", color: "blue", Icon: BookOpen },
  { id: "suku-kata", title: "Suku Kata", english: "Syllables", description: "Bina bacaan dengan KVK dan bunyi bergabung.", sample: "bas jam", color: "mint", Icon: BookOpen },
  { id: "perkataan", title: "Perkataan", english: "Words", description: "Padan perkataan dengan gambar ikut level.", sample: "epal · rumah", color: "blue", Icon: Image }
];

const VOKAL = [
  { id: "a", label: "a", sound: "a", audioPath: "/audio/vowels/a.mp3" },
  { id: "e-pepet", label: "e", variant: "pepet", sound: "e", audioPath: "/audio/vowels/e-pepet.mp3" },
  { id: "e-taling", label: "e", variant: "taling", sound: "e", audioPath: "/audio/vowels/e-taling.mp3" },
  { id: "i", label: "i", sound: "i", audioPath: "/audio/vowels/i.mp3" },
  { id: "o", label: "o", sound: "o", audioPath: "/audio/vowels/o.mp3" },
  { id: "u", label: "u", sound: "u", audioPath: "/audio/vowels/u.mp3" }
];

