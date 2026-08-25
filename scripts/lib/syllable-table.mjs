/**
 * KV syllable inventory shared by the audio generator and the QA script.
 *
 * The app names files KV_<suku kata>.mp3, with a suffix on the two "e" rows
 * because Malay reads a final "e" either as pepet (/ə/) or taling (/e/).
 */

export const ONSETS = [..."bcdfghjklmnpqrstvwxyz"];
export const VOWELS = ["a", "e", "i", "o", "u"];
export const E_SOUNDS = ["e-pepet", "e-taling"];

// Google Translate TTS only uses the Malay voice when tl is a real locale.
export const TTS_LOCALE = "ms";

export function kvSyllableFile(syllable, eSound = "") {
  return `KV/KV_${syllable}${eSound ? `_${eSound}` : ""}.mp3`;
}

export function kvEntries() {
  const entries = [];
  for (const onset of ONSETS) {
    for (const vowel of VOWELS) {
      const syllable = `${onset}${vowel}`;
      if (vowel !== "e") {
        entries.push({ key: syllable, syllable, onset, vowel, eSound: "", file: kvSyllableFile(syllable) });
        continue;
      }
      for (const eSound of E_SOUNDS) {
        entries.push({
          key: `${syllable}#${eSound}`,
          syllable,
          onset,
          vowel,
          eSound,
          file: kvSyllableFile(syllable, eSound)
        });
      }
    }
  }
  return entries;
}

/** KVK rows are read from the manifest the app already ships. */
export function parseManifestCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift().split(",").map((cell) => cell.trim());
  return lines.map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((key, index) => [key, (cells[index] ?? "").trim()]));
  });
}

export function toManifestCsv(rows) {
  const header = [
    "pattern",
    "syllable",
    "vowel_sound",
    "tts_locale",
    "query_text",
    "example_word",
    "file",
    "status"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((key) => row[key] ?? "").join(","));
  }
  return `${lines.join("\n")}\n`;
}
