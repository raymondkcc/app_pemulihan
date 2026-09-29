export const FACTS = Object.freeze(
  Array.from({ length: 9 }, (_, first) => Array.from({ length: 9 }, (_, second) => ({
    key: `${first + 1}x${second + 1}`,
    first: first + 1,
    second: second + 1,
    answer: (first + 1) * (second + 1)
  }))).flat()
);

export const FACT_KEYS = Object.freeze(FACTS.map((fact) => fact.key));
export const QUESTION_COUNTS = Object.freeze([15, 30, 50]);
export const DIFFICULTIES = Object.freeze(["easy", "medium", "hard"]);

export const DIFFICULTY_INFO = Object.freeze({
  easy: { label: "Mudah", english: "Easy", speed: 0.017 },
  medium: { label: "Sederhana", english: "Medium", speed: 0.024 },
  hard: { label: "Sukar", english: "Hard", speed: 0.034 }
});

const DEFAULT_STAT = Object.freeze({
  attempts: 0,
  correct: 0,
  wrong: 0,
  currentStreak: 0,
  lastResult: null,
  lastAnsweredAt: null,
  nextDueAt: null
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getFact(key) {
  return FACTS.find((fact) => fact.key === key) || null;
}

export function createEmptyProgress() {
  return Object.fromEntries(FACTS.map((fact) => [fact.key, { ...DEFAULT_STAT }]));
}

export function normaliseProgress(progress = {}) {
  const source = progress?.multiplicationFacts || progress || {};
  return Object.fromEntries(FACTS.map((fact) => {
    const raw = source[fact.key] || {};
    return [fact.key, {
      attempts: Math.max(0, Math.round(asNumber(raw.attempts))),
      correct: Math.max(0, Math.round(asNumber(raw.correct))),
      wrong: Math.max(0, Math.round(asNumber(raw.wrong))),
      currentStreak: Math.max(0, Math.round(asNumber(raw.currentStreak))),
      lastResult: raw.lastResult === "correct" || raw.lastResult === "wrong" ? raw.lastResult : null,
      lastAnsweredAt: raw.lastAnsweredAt || null,
      nextDueAt: raw.nextDueAt || null
    }];
  }));
}

export function factAccuracy(stat = DEFAULT_STAT) {
  const attempts = Math.max(0, asNumber(stat.attempts));
  return attempts ? clamp(asNumber(stat.correct) / attempts, 0, 1) : 0;
}

export function factCategory(stat = DEFAULT_STAT, now = Date.now()) {
  const attempts = Math.max(0, asNumber(stat.attempts));
  const accuracy = factAccuracy(stat);
  const dueAt = asTimestamp(stat.nextDueAt);
  const overdue = dueAt !== null && dueAt <= now;

  if (attempts === 0) return "new";
  if (stat.lastResult === "wrong" || accuracy < 0.8 || overdue) return "weak";
  if (attempts < 3 || asNumber(stat.currentStreak) < 2) return "new";
  return "mastered";
}

function weightedPick(items, getWeight, rng) {
  if (!items.length) return null;
  const weights = items.map((item) => Math.max(0.01, getWeight(item)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return items[index];
  }
  return items[items.length - 1];
}

function categoryWeight(fact, stat, category, now) {
  const accuracy = factAccuracy(stat);
  const overdue = asTimestamp(stat.nextDueAt) !== null && asTimestamp(stat.nextDueAt) <= now;
  const recentWrong = stat.lastResult === "wrong";
  const distanceFromMastery = 1 - accuracy;

  if (category === "weak") {
    return 1 + distanceFromMastery * 6 + (recentWrong ? 3.5 : 0) + (overdue ? 2 : 0);
  }
  if (category === "new") {
    return 1 + (asNumber(stat.attempts) === 0 ? 2 : 0) + (asNumber(stat.attempts) < 3 ? 1 : 0);
  }
  return 1 + accuracy + Math.min(2, asNumber(stat.currentStreak) * 0.15);
}

export function selectNextFact({
  mode = "student",
  progress = {},
  selectedKeys = FACT_KEYS,
  previousKey = null,
  rng = Math.random,
  now = Date.now()
} = {}) {
  const stats = normaliseProgress(progress);
  // Student mode is intentionally not filterable by the learner.  Keep the
  // full ordered fact pool here as well as in createSessionConfig so callers
  // cannot accidentally bypass the adaptive policy by passing selectedKeys.
  const allowed = new Set(mode === "student"
    ? FACT_KEYS
    : (Array.isArray(selectedKeys) ? selectedKeys : FACT_KEYS));
  let candidates = FACTS.filter((fact) => allowed.has(fact.key));
  if (!candidates.length) return null;

  if (candidates.length > 1 && previousKey) {
    const withoutPrevious = candidates.filter((fact) => fact.key !== previousKey);
    if (withoutPrevious.length) candidates = withoutPrevious;
  }

  const categories = Object.fromEntries(candidates.map((fact) => [fact.key, factCategory(stats[fact.key], now)]));
  const buckets = {
    weak: candidates.filter((fact) => categories[fact.key] === "weak"),
    new: candidates.filter((fact) => categories[fact.key] === "new"),
    mastered: candidates.filter((fact) => categories[fact.key] === "mastered")
  };

  const recentlyWrong = buckets.weak.filter((fact) => stats[fact.key].lastResult === "wrong");
  let desired;
  if (mode === "student" && recentlyWrong.length && rng() < 0.35) {
    // Give a recent miss a fast second look without allowing it to repeat
    // immediately. It remains part of the weak 70% lane, but is not lost
    // among many older weak facts.
    desired = "recentWrong";
  } else if (mode === "student") {
    const roll = rng();
    desired = roll < 0.7 ? "weak" : roll < 0.9 ? "new" : "mastered";
  } else {
    // Teaching mode still benefits from prior history, but never leaves the teacher's pool.
    const roll = rng();
    desired = roll < 0.55 ? "weak" : roll < 0.82 ? "new" : "mastered";
  }

  const desiredBucket = desired === "recentWrong" ? recentlyWrong : buckets[desired];
  const bucket = desiredBucket.length ? desiredBucket : [
    ...buckets.weak,
    ...buckets.new,
    ...buckets.mastered
  ].filter((fact, index, list) => list.findIndex((item) => item.key === fact.key) === index);

  return weightedPick(bucket, (fact) => categoryWeight(fact, stats[fact.key], categories[fact.key], now), rng) || candidates[0];
}

export function recordFactOutcome(progress = {}, factKey, correct, now = Date.now()) {
  const current = normaliseProgress(progress);
  if (!current[factKey]) return current;

  const stat = current[factKey];
  const attempts = stat.attempts + 1;
  const nextStreak = correct ? stat.currentStreak + 1 : 0;
  const nextDueAt = correct
    ? new Date(now + (nextStreak >= 3 ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000)).toISOString()
    : new Date(now).toISOString();

  return {
    ...current,
    [factKey]: {
      ...stat,
      attempts,
      correct: stat.correct + (correct ? 1 : 0),
      wrong: stat.wrong + (correct ? 0 : 1),
      currentStreak: nextStreak,
      lastResult: correct ? "correct" : "wrong",
      lastAnsweredAt: new Date(now).toISOString(),
      nextDueAt
    }
  };
}

export function factDeltasFromOutcomes(outcomes = []) {
  const deltas = {};
  outcomes.forEach(({ factKey, correct }) => {
    if (!deltas[factKey]) deltas[factKey] = { attempts: 0, correct: 0, wrong: 0, lastResult: null };
    deltas[factKey].attempts += 1;
    if (correct) deltas[factKey].correct += 1;
    else deltas[factKey].wrong += 1;
    deltas[factKey].lastResult = correct ? "correct" : "wrong";
  });
  return deltas;
}

export function getWeakFacts(progress = {}, limit = 5) {
  const stats = normaliseProgress(progress);
  return FACTS
    .map((fact) => ({ fact, stat: stats[fact.key], accuracy: factAccuracy(stats[fact.key]), category: factCategory(stats[fact.key]) }))
    .filter(({ stat, category }) => stat.attempts > 0 && category !== "mastered")
    .sort((left, right) => {
      if (left.accuracy !== right.accuracy) return left.accuracy - right.accuracy;
      return right.stat.wrong - left.stat.wrong;
    })
    .slice(0, limit);
}

export function getNextDifficulty(currentDifficulty, { consecutiveCorrect = 0, consecutiveWrong = 0 } = {}) {
  const currentIndex = Math.max(0, DIFFICULTIES.indexOf(currentDifficulty));
  if (consecutiveWrong >= 2) return DIFFICULTIES[Math.max(0, currentIndex - 1)];
  if (consecutiveCorrect >= 4) return DIFFICULTIES[Math.min(DIFFICULTIES.length - 1, currentIndex + 1)];
  return DIFFICULTIES[currentIndex] || "easy";
}

export function questionCountForMode(mode, requestedCount) {
  if (mode === "student") return 15;
  return QUESTION_COUNTS.includes(Number(requestedCount)) ? Number(requestedCount) : 15;
}

export function createSessionConfig({ mode = "student", selectedKeys = FACT_KEYS, difficulty = "easy", questionCount = 15 } = {}) {
  const selected = [...new Set((selectedKeys || []).filter((key) => FACT_KEYS.includes(key)))];
  return {
    mode: mode === "teacher" ? "teacher" : "student",
    selectedKeys: mode === "student" ? [...FACT_KEYS] : selected,
    difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : "easy",
    questionCount: questionCountForMode(mode, questionCount)
  };
}
