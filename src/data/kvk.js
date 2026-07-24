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

export function pickAdaptiveEnding(stats, previous = "") {
  const pool = ENDINGS.length > 1 ? ENDINGS.filter((ending) => ending !== previous) : ENDINGS;
  const weights = pool.map((ending) => {
    const current = stats[ending] ?? { correct: 0, wrong: 0 };
    const attempts = current.correct + current.wrong;
    const errorRate = attempts === 0 ? 0 : current.wrong / attempts;
    const freshPracticeBoost = attempts === 0 ? 1.5 : 0;
    return 1 + (errorRate * 5) + freshPracticeBoost;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let pick = Math.random() * totalWeight;

  for (let index = 0; index < pool.length; index += 1) {
    pick -= weights[index];
    if (pick <= 0) return pool[index];
  }

  return pool[pool.length - 1];
}
