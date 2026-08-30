export const PACK_ONSETS = [..."bcdfghjklmnpqrstvwyz"];
export const PACK_VOWELS = ["a", "e", "i", "o", "u"];
const KV_AUDIO_VERSION = "20260830-2";

export const E_SOUND_OPTIONS = [
  { id: "e-pepet", label: "e pepet", hint: "/ə/ · enam · belum" },
  { id: "e-taling", label: "e taling", hint: "/e/ · jelas" }
];

export function createKvItem(onset, vowel, eSound = "e-pepet") {
  const syllable = `${onset}${vowel}`;
  const sound = vowel === "e" ? eSound : "standard";
  return {
    id: `kv-${syllable}-${sound}`,
    label: syllable,
    pattern: "KV",
    syllable,
    sound,
    audioPath: `/audio/syllables/KV/KV_${syllable}${sound === "standard" ? "" : `_${sound}`}.mp3?v=${KV_AUDIO_VERSION}`
  };
}

export function createKvRows(eSound = "e-pepet") {
  return PACK_ONSETS.map((onset) => PACK_VOWELS.map((vowel) => createKvItem(onset, vowel, eSound)));
}

export async function loadKvkPack() {
  const response = await fetch("/audio/syllables/manifest.csv");
  if (!response.ok) throw new Error("Fail audio KVK tidak dapat dibaca.");

  const lines = (await response.text()).trim().split(/\r?\n/).slice(1);
  return lines
    .map((line) => {
      const [pattern, syllable, sound, locale, queryText, example, file] = line.split(",");
      return { pattern, syllable, sound, locale, queryText, example, file };
    })
    .filter((item) => item.pattern === "KVK" && item.file && item.syllable);
}

export function pickPackSyllable(items, ending, previousId = "") {
  const choices = items.filter((item) => !ending || item.syllable.endsWith(ending));
  if (!choices.length) return null;

  const freshChoices = choices.filter((item) => `${item.syllable}-${item.sound}` !== previousId);
  const pool = freshChoices.length ? freshChoices : choices;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function syllableAudioPath(item) {
  return item?.audioPath || (item?.file ? `/audio/syllables/${item.file}` : "");
}
