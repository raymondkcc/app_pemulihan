export const PERKATAAN_SKILLS = [
  {
    id: "k5",
    code: "K5",
    title: "KVKV",
    color: "coral",
    words: [
      "baju",
      "bola",
      "buku",
      "beca",
      "cili",
      "gigi",
      "lori",
      "lima",
      "mata",
      "kuda",
      "meja",
      "roti",
      "satu",
      "sofa",
      "tiga",
      "tali",
      "topi",
      "yoyo"
    ]
  },
  {
    id: "k6",
    code: "K6",
    title: "VKV",
    color: "coral",
    words: ["ibu", "api", "eja", "ubi", "ini", "itu", "uji", "ada"]
  },
  {
    id: "k7",
    code: "K7",
    title: "KVKVKV",
    color: "purple",
    words: ["kelapa", "kereta", "kerusi", "kamera", "bateri", "tomato", "lelaki", "kepala"]
  },
  {
    id: "k8",
    code: "K8",
    title: "KVK",
    color: "cyan",
    words: ["bas", "jus", "gam", "jam", "kek", "rak", "pen", "pin", "cat"]
  },
  {
    id: "k10",
    code: "K10",
    title: "VKV(K)",
    color: "green",
    words: ["ayam", "epal", "ekor", "enam", "emak", "ikan", "itik", "ubat", "oren"]
  },
  {
    id: "k11",
    code: "K11",
    title: "KVKVK",
    color: "orange",
    words: ["kasut", "pokok", "rumah", "botol", "datuk", "nenek", "katil", "telur", "makan"]
  },
  {
    id: "k12",
    code: "K12",
    title: "KVKKV",
    color: "blue",
    words: ["lembu", "lampu", "panda", "bomba", "pintu", "warna", "mandi", "cikgu", "kunci"]
  },
  {
    id: "k13",
    code: "K13",
    title: "KVKKVK",
    color: "coral",
    words: ["tandas", "biskut", "cantik", "sampah", "gambar", "rambut", "kertas", "nombor", "doktor"]
  },
  {
    id: "k14-k15",
    code: "K14 dan K15",
    title: "KVKVKVK",
    color: "purple",
    words: ["sekolah", "zirafah", "telefon", "basikal", "selipar", "pemadam", "komputer", "rambutan", "hospital"]
  },
  {
    id: "k16-k17",
    code: "K16 dan K17",
    title: "KVK (final ng)",
    color: "cyan",
    words: ["tong", "wang", "bank"]
  },
  {
    id: "k18-k19",
    code: "K18 dan K19",
    title: "VKVK (final ng)",
    color: "green",
    words: ["abang", "udang", "orang", "sotong", "kucing", "pisang", "burung", "padang", "payung"]
  },
  {
    id: "k20-k21",
    code: "K20 dan K21",
    title: "KVKKVK (ng)",
    color: "orange",
    words: ["gunting", "panjang", "bintang", "kambing", "dinding", "tangga", "mangga", "bangku", "singki"]
  },
  {
    id: "k22-k23",
    code: "K22 dan K23",
    title: "KVKKVK (ngg)",
    color: "blue",
    words: ["tingkap", "manggis", "tinggal", "pinggan", "mangkuk", "congkak", "pingpong", "longkang", "tanglung"]
  },
  {
    id: "k24-k25",
    code: "K24 dan K25",
    title: "KVKVKVK (ng)",
    color: "coral",
    words: ["berenang", "menolong", "belakang", "binatang", "memancing", "keranjang", "melancong", "menendang", "pelampung"]
  },
  {
    id: "k26-k28",
    code: "K26, K27 dan K28",
    title: "Konsonan bergabung (ng, ngg)",
    color: "purple",
    words: ["berjoging", "membaling", "menggosok", "tenggelam", "gelongsor", "perangkap"]
  },
  {
    id: "k29-diftong",
    code: "K29",
    title: "Diftong",
    color: "cyan",
    words: ["kedai", "pantai", "ramai", "pisau", "harimau", "pulau", "kaloi", "amoi", "cakoi"]
  },
  {
    id: "k29-vokal-berganding",
    code: "K29",
    title: "Vokal berganding",
    color: "green",
    words: ["air", "daun", "buah", "kuih", "piano", "durian", "duit", "suis", "paip"]
  },
  {
    id: "k30a",
    code: "K30(a)",
    title: "Digraf ng & ny",
    color: "orange",
    words: ["bunga", "tangan", "mengelap", "mengutip", "menangis", "nyamuk", "menyanyi", "penyapu", "menyimpan"]
  },
  {
    id: "k30b",
    code: "K30(b)",
    title: "Digraf sy & kh",
    color: "blue",
    words: ["syampu", "syiling", "Khamis", "khemah"]
  },
  {
    id: "k30c",
    code: "K30(c)",
    title: "Konsonan bergabung",
    color: "coral",
    words: ["stoking", "troli", "plastik", "krayon", "aiskrim", "brokoli", "klip", "dram", "skuter"]
  }
];

export function perkataanItemCount(skill) {
  return (skill.practice?.length || 0) + (skill.words?.length || 0);
}

// Phonetic corrections for TTS - maps words to phonetic spellings
// that will be pronounced correctly by the browser's speech synthesis
export const PHONETIC_MAP = {
  // Words from K8 that are commonly mispronounced
  "bas": "baas",       // "bus" not "bass"
  "jus": "juis",       // "juice" not "just"
  // K5 words that need phonetic corrections
  "baju": "bah joo",       // 'j' should be soft, 'u' is 'oo'
  "buku": "boo koo",       // 'u' is 'oo' sound
  "gigi": "gee gee",       // 'g' is soft, 'i' is 'ee'
  "kuda": "koo dah",       // 'u' is 'oo', 'a' is 'ah'
  "meja": "meh jah",       // 'j' is soft
  "tiga": "tee gah",       // 'i' is 'ee', 'g' is soft
  "tali": "tah lee",       // 'a' is 'ah', 'i' is 'ee'
  // More K5 words
  "bola": "boh lah",       // 'o' is like 'oh', 'a' is 'ah'
  "cili": "chee lee",      // 'c' is 'ch', 'i' is 'ee'
  "lori": "loh ree",       // 'o' is 'oh', 'i' is 'ee'
  "lima": "lee mah",       // 'i' is 'ee', 'a' is 'ah'
  "mata": "mah tah",       // 'a' is 'ah'
  "roti": "roh tee",       // 'o' is 'oh', 'i' is 'ee'
  "satu": "sah too",       // 'a' is 'ah', 'u' is 'oo'
  "sofa": "soh fah",       // 'o' is 'oh', 'a' is 'ah'
  "topi": "toh pee",       // 'o' is 'oh', 'i' is 'ee'
  "yoyo": "yoh yoh",       // 'y' as in 'yo'
  "cat": "chat",       // Malay "cat" sounds like English "chat"
  "pen": "penn",       // Ensure short 'e' sound
  "pin": "peen",       // Malay 'i' is like English 'ee'
  "rak": "raak",       // Long 'a' sound
  "kek": "keik",       // Malay 'e' can be schwa or 'ay'
  "gam": "gaam",       // Long 'a'
  "jam": "jaam",       // Long 'a'
  // Common words that might be mispronounced
  "cili": "cheelee",   // Malay 'c' is like 'ch'
  "beca": "becha",     // 'c' as 'ch'
  "epal": "eypal",     // 'e' as in "egg"
  "oren": "oren",      // Keep as is
  "ubi": "oobi",       // 'u' is like 'oo'
  "eja": "eyja",       // 'e' pronounced
  "itu": "eetoo",      // Clear vowels
  "api": "ahpee",      // 'a' as 'ah', 'i' as 'ee'
  "ibu": "eeboo",
  "ini": "eenee",
  "ada": "ahda",
  "uji": "oojee",
  "tomato": "tomahhtoh",
  "bateri": "bahterree",
  "kamera": "kahmerah",
  "lelaki": "lehlahkee",
  "kelapa": "kelahpah",
  "kereta": "keretah",
  "kerusi": "keroosee",
  "kepala": "kehpahlah",
  "ayam": "ahyahm",
  "ikan": "eekahn",
  "itik": "eeteek",
  "emak": "ehmahk",
  "ekor": "ehkor",
  "ubat": "oobat",
  "enam": "ehnahm",
  "pokok": "pohkohk",
  "rumah": "roomah",
  "botol": "bohtohl",
  "datuk": "dahtook",
  "nenek": "nehnek",
  "katil": "kahteel",
  "telur": "teloor",
  "kasut": "kahsoot",
  "makan": "mahkahn",
  "bomba": "bohmbah",
  "panda": "pahndah",
  "lembu": "lehmboo",
  "lampu": "lahmpoo",
  "pintu": "peentoo",
  "warna": "wahrrnah",
  "mandi": "mahndee",
  "cikgu": "cheekgoo",
  "kunci": "koonchee",
  "biskut": "beeskoot",
  "tandas": "tahndahs",
  "cantik": "chahnteek",
  "sampah": "sahmpah",
  "gambar": "gahmbahr",
  "rambut": "rahm boot",
  "kertas": "kehr tahs",
  "nombor": "nohm bohr",
  "doktor": "dohk tohr",
  "zirafah": "zee rah fah",
  "telefon": "teh leh fohn",
  "basikal": "bah see kahl",
  "selipar": "seh lee pahr",
  "pemadam": "peh mah dahm",
  "komputer": "kohm poo tehr",
  "rambutan": "rahm boo tahn",
  "hospital": "hohs pee tahl",
  "sekolah": "seh koh lah",
  // Diftong words
  "pisau": "pee sow",
  "harimau": "hah ree mow",
  "pulau": "poo low",
  "kaloi": "kah loy",
  "cakoi": "chah koy",
  "durian": "doo ree ahn",
  "duit": "doo eet",
  "kuih": "koo ee",
  "durian": "doo ree ahn",
  "buah": "boo ah",
  "daun": "dow oon",
  "paip": "pah eep",
  "suis": "soo ees",
  "piano": "pee ah no",
  // Vokal berganding
  "air": "ah eer",
  // Digraf words
  "bunga": "boo ngah",
  "tangan": "tah ngahn",
  "mengelap": "mehng eh lahp",
  "mengutip": "mehng oo teep",
  "menangis": "meh nah ngees",
  "nyamuk": "nyah mook",
  "menyanyi": "meh nyah nyee",
  "penyapu": "peh nyah poo",
  "menyimpan": "meh neem pahn",
  "syampu": "shahm poo",
  "syiling": "shee leeng",
  "khemah": "keh mah",
  // Konsonan bergabung
  "stoking": "stoh keeng",
  "plastik": "plahs teek",
  "krayon": "krah yohn",
  "aiskrim": "ah ee skreem",
  "brokoli": "broh koh lee",
  "skuter": "skoo tehr",
  "klip": "kleep",
  "dram": "drahm",
  "troli": "troh lee"
};

// Function to get phonetic spelling for a word
export function getPhonetic(word) {
  // Try exact match first
  if (PHONETIC_MAP[word]) {
    return PHONETIC_MAP[word];
  }
  // Try lowercase
  const lower = word.toLowerCase();
  if (PHONETIC_MAP[lower]) {
    return PHONETIC_MAP[lower];
  }
  return word; // Return original if no mapping found
}

// Diagnostic function to test TTS pronunciation
// Call this in browser console: testTTS(["jus","bas","cat"])
export function testTTS(words, usePhonetic = true) {
  const results = words.map(word => {
    const phonetic = getPhonetic(word);
    return {
      word,
      phonetic,
      changed: phonetic !== word
    };
  });
  console.table(results);
  return results;
}

// Get all words from all skills for bulk testing
export function getAllWords() {
  return PERKATAAN_SKILLS.flatMap(skill => [
    ...(skill.practice || []),
    ...(skill.words || [])
  ]);
}

// Check which words don't have phonetic mappings
export function findUncoveredWords() {
  const allWords = getAllWords();
  const uncovered = allWords.filter(word => !PHONETIC_MAP[word] && !PHONETIC_MAP[word.toLowerCase()]);
  console.log(`Total words: ${allWords.length}`);
  console.log(`Words without phonetic mapping: ${uncovered.length}`);
  console.log("Uncovered words:", uncovered);
  return uncovered;
}
