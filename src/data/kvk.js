export const ENDINGS = ["s", "m", "n", "t", "h", "p", "k", "l", "r"];

const ONSETS = ["b", "c", "d", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "w", "y"];
const VOWELS = ["a", "i", "u", "e", "o"];

export const SYLLABLES_BY_ENDING = Object.fromEntries(
  ENDINGS.map((ending) => [
    ending,
    ONSETS.flatMap((onset) => VOWELS.map((vowel) => `${onset}${vowel}${ending}`))
  ])
);

export function pickSyllable(ending, previous = "") {
  const choices = ending ? SYLLABLES_BY_ENDING[ending] : ENDINGS.flatMap((key) => SYLLABLES_BY_ENDING[key]);
  if (choices.length === 1) return choices[0];

  let next = choices[Math.floor(Math.random() * choices.length)];
  while (next === previous) next = choices[Math.floor(Math.random() * choices.length)];
  return next;
}
