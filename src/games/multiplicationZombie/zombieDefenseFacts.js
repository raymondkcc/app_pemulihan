import { DIFFICULTIES, DIFFICULTY_INFO, FACTS as MULTIPLICATION_FACTS, QUESTION_COUNTS } from "./multiplicationFacts.js";

export const OPERATION_KEYS = Object.freeze(["tambah", "tolak", "darab", "bahagi"]);

const OPERATION_INFO = Object.freeze({
  tambah: { label: "Tambah", english: "Addition", symbol: "+", helper: "Gabung nombor" },
  tolak: { label: "Tolak", english: "Subtraction", symbol: "−", helper: "Ambil dan kira" },
  darab: { label: "Darab", english: "Multiplication", symbol: "×", helper: "Kumpulan sama banyak" },
  bahagi: { label: "Bahagi", english: "Division", symbol: "÷", helper: "Kongsi sama rata" }
});

function range(size) {
  return Array.from({ length: size }, (_, index) => index + 1);
}

function rangeBetween(start, end, step = 1) {
  return Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, index) => start + index * step);
}

const ONE_DIGIT_VALUES = Object.freeze(range(9));
const TWO_DIGIT_VALUES = Object.freeze(rangeBetween(10, 99));
const TENS_VALUES = Object.freeze(rangeBetween(10, 90, 10));
const FIVE_VALUES = Object.freeze(rangeBetween(5, 95, 5));

function createFact(operation, first, second, minimumDifficulty = "easy") {
  const symbol = operation === "tambah" ? "+" : operation === "tolak" ? "-" : "/";
  const fact = {
    key: `${first}${symbol}${second}`,
    first,
    second,
    answer: operation === "tambah" ? first + second : operation === "tolak" ? first - second : first / second,
    operation
  };
  // Keep the difficulty metadata out of serialized progress and the public fact shape.
  Object.defineProperty(fact, "minimumDifficulty", { value: minimumDifficulty, enumerable: false });
  return fact;
}

function appendFact(facts, seenKeys, operation, first, second, minimumDifficulty) {
  const fact = createFact(operation, first, second, minimumDifficulty);
  if (seenKeys.has(fact.key)) return;
  seenKeys.add(fact.key);
  facts.push(fact);
}

function buildAdditionFacts() {
  const facts = [];
  const seenKeys = new Set();

  // Easy keeps the existing one-digit convention and excludes sums of 18 or more.
  ONE_DIGIT_VALUES.forEach((first) => {
    ONE_DIGIT_VALUES.forEach((second) => {
      if (first + second < 18) appendFact(facts, seenKeys, "tambah", first, second, "easy");
    });
  });

  // Medium keeps every one-digit fact, including the harder sums of 18, and
  // adds tens, fives, and two-digit plus one-digit sums below 23.
  ONE_DIGIT_VALUES.forEach((first) => {
    ONE_DIGIT_VALUES.forEach((second) => {
      if (first + second <= 18) appendFact(facts, seenKeys, "tambah", first, second, "medium");
    });
  });
  ONE_DIGIT_VALUES.forEach((digit) => {
    appendFact(facts, seenKeys, "tambah", digit, 10, "medium");
    appendFact(facts, seenKeys, "tambah", 10, digit, "medium");
  });
  TWO_DIGIT_VALUES.forEach((value) => {
    appendFact(facts, seenKeys, "tambah", value, 10, "medium");
    appendFact(facts, seenKeys, "tambah", 10, value, "medium");
    appendFact(facts, seenKeys, "tambah", value, 5, "medium");
    appendFact(facts, seenKeys, "tambah", 5, value, "medium");
  });
  TENS_VALUES.forEach((first) => {
    TENS_VALUES.forEach((second) => appendFact(facts, seenKeys, "tambah", first, second, "medium"));
  });
  TWO_DIGIT_VALUES.forEach((twoDigit) => {
    ONE_DIGIT_VALUES.forEach((digit) => {
      if (twoDigit + digit < 23) {
        appendFact(facts, seenKeys, "tambah", twoDigit, digit, "medium");
        appendFact(facts, seenKeys, "tambah", digit, twoDigit, "medium");
      }
    });
  });

  // Hard samples the complete two-digit pair pool so the normal selector can randomize them.
  TWO_DIGIT_VALUES.forEach((first) => {
    TWO_DIGIT_VALUES.forEach((second) => appendFact(facts, seenKeys, "tambah", first, second, "hard"));
  });
  return facts;
}

function buildSubtractionFacts() {
  const facts = [];
  const seenKeys = new Set();

  // Easy uses non-negative one-digit subtraction and therefore stays under 10.
  ONE_DIGIT_VALUES.forEach((first) => {
    range(first).forEach((second) => appendFact(facts, seenKeys, "tolak", first, second, "easy"));
  });

  // Medium adds two-digit minus one-digit facts whose answer is below 18.
  TWO_DIGIT_VALUES.forEach((twoDigit) => {
    ONE_DIGIT_VALUES.forEach((digit) => {
      if (twoDigit >= digit && twoDigit - digit < 18) appendFact(facts, seenKeys, "tolak", twoDigit, digit, "medium");
    });
  });

  // Hard adds subtraction involving tens and fives. This includes a tens/fives
  // minuend as well as subtracting a multiple of ten or five.
  const patternedValues = [...new Set([...TENS_VALUES, ...FIVE_VALUES])];
  TWO_DIGIT_VALUES.forEach((first) => {
    patternedValues.forEach((second) => {
      if (first >= second) appendFact(facts, seenKeys, "tolak", first, second, "hard");
    });
  });
  patternedValues.forEach((first) => {
    ONE_DIGIT_VALUES.forEach((second) => {
      if (first >= second) appendFact(facts, seenKeys, "tolak", first, second, "hard");
    });
  });
  return facts;
}

function buildFacts(operation) {
  if (operation === "darab") return MULTIPLICATION_FACTS;
  if (operation === "bahagi") {
    return range(9).flatMap((divisor) => range(9).map((quotient) => createFact(operation, divisor * quotient, divisor)));
  }
  if (operation === "tolak") return buildSubtractionFacts();
  return buildAdditionFacts();
}

const DIFFICULTY_RANK = Object.freeze({ easy: 0, medium: 1, hard: 2 });

function factsAtDifficulty(facts, difficulty = "easy") {
  const level = DIFFICULTIES.includes(difficulty) ? difficulty : "easy";
  const rank = DIFFICULTY_RANK[level];
  return facts.filter((fact) => DIFFICULTY_RANK[fact.minimumDifficulty || "easy"] <= rank);
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function asNumber(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
function asTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
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

export function operationInfo(operation = "darab") {
  return OPERATION_INFO[OPERATION_KEYS.includes(operation) ? operation : "darab"];
}

export function operationSelectionFromNumbers(operation = "darab", numbers = []) {
  const normalizedOperation = OPERATION_KEYS.includes(operation) ? operation : "darab";
  const chosen = new Set((numbers || []).map(Number));
  const facts = buildFacts(normalizedOperation);
  return facts.filter((fact) => {
    const values = normalizedOperation === "bahagi"
      ? [fact.second, fact.answer]
      : [fact.first, fact.second];
    return values.some((value) => chosen.has(value));
  }).map((fact) => fact.key);
}

export function createOperationEngine(operation = "darab") {
  const normalizedOperation = OPERATION_KEYS.includes(operation) ? operation : "darab";
  const facts = Object.freeze(buildFacts(normalizedOperation));
  const factKeys = Object.freeze(facts.map((fact) => fact.key));
  const defaultStat = { attempts: 0, correct: 0, wrong: 0, currentStreak: 0, lastResult: null, lastAnsweredAt: null, nextDueAt: null };

  function createEmptyProgress() {
    return Object.fromEntries(facts.map((fact) => [fact.key, { ...defaultStat }]));
  }

  function normaliseProgress(progress = {}) {
    const source = progress?.facts || progress || {};
    return Object.fromEntries(facts.map((fact) => {
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

  function factAccuracy(stat = defaultStat) {
    const attempts = Math.max(0, asNumber(stat.attempts));
    return attempts ? clamp(asNumber(stat.correct) / attempts, 0, 1) : 0;
  }

  function factCategory(stat = defaultStat, now = Date.now()) {
    const attempts = Math.max(0, asNumber(stat.attempts));
    const accuracy = factAccuracy(stat);
    const dueAt = asTimestamp(stat.nextDueAt);
    const overdue = dueAt !== null && dueAt <= now;
    if (attempts === 0) return "new";
    if (stat.lastResult === "wrong" || accuracy < 0.8 || overdue) return "weak";
    if (attempts < 3 || asNumber(stat.currentStreak) < 2) return "new";
    return "mastered";
  }

  function categoryWeight(stat, category, now) {
    const accuracy = factAccuracy(stat);
    const dueAt = asTimestamp(stat.nextDueAt);
    const overdue = dueAt !== null && dueAt <= now;
    if (category === "weak") return 1 + (1 - accuracy) * 6 + (stat.lastResult === "wrong" ? 3.5 : 0) + (overdue ? 2 : 0);
    if (category === "new") return 1 + (stat.attempts === 0 ? 2 : 0) + (stat.attempts < 3 ? 1 : 0);
    return 1 + accuracy + Math.min(2, stat.currentStreak * 0.15);
  }

  function selectNextFact({ mode = "student", progress = {}, selectedKeys = factKeys, difficulty = "easy", previousKey = null, rng = Math.random, now = Date.now() } = {}) {
    const stats = normaliseProgress(progress);
    const availableFacts = factsAtDifficulty(facts, difficulty);
    const allowed = new Set(mode === "student"
      ? availableFacts.map((fact) => fact.key)
      : (Array.isArray(selectedKeys) ? selectedKeys : factKeys));
    let candidates = availableFacts.filter((fact) => allowed.has(fact.key));
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
    const recent = buckets.weak.filter((fact) => stats[fact.key].lastResult === "wrong");
    let desired;
    if (mode === "student" && recent.length && rng() < 0.35) desired = "recent";
    else if (mode === "student") { const roll = rng(); desired = roll < 0.7 ? "weak" : roll < 0.9 ? "new" : "mastered"; }
    else { const roll = rng(); desired = roll < 0.55 ? "weak" : roll < 0.82 ? "new" : "mastered"; }
    const desiredBucket = desired === "recent" ? recent : buckets[desired];
    const bucket = desiredBucket.length ? desiredBucket : [...buckets.weak, ...buckets.new, ...buckets.mastered].filter((fact, index, list) => list.findIndex((item) => item.key === fact.key) === index);
    return weightedPick(bucket, (fact) => categoryWeight(stats[fact.key], categories[fact.key], now), rng) || candidates[0];
  }

  function recordFactOutcome(progress = {}, factKey, correct, now = Date.now()) {
    const current = normaliseProgress(progress);
    if (!current[factKey]) return current;
    const stat = current[factKey];
    const attempts = stat.attempts + 1;
    const currentStreak = correct ? stat.currentStreak + 1 : 0;
    return { ...current, [factKey]: { ...stat, attempts, correct: stat.correct + (correct ? 1 : 0), wrong: stat.wrong + (correct ? 0 : 1), currentStreak, lastResult: correct ? "correct" : "wrong", lastAnsweredAt: new Date(now).toISOString(), nextDueAt: new Date(now + (correct && currentStreak >= 3 ? 86400000 : correct ? 900000 : 0)).toISOString() } };
  }

  function factDeltasFromOutcomes(outcomes = []) {
    const deltas = {};
    outcomes.forEach(({ factKey, correct }) => {
      if (!deltas[factKey]) deltas[factKey] = { attempts: 0, correct: 0, wrong: 0, lastResult: null };
      deltas[factKey].attempts += 1;
      if (correct) deltas[factKey].correct += 1; else deltas[factKey].wrong += 1;
      deltas[factKey].lastResult = correct ? "correct" : "wrong";
    });
    return deltas;
  }

  function getFactsForDifficulty(difficulty = "easy") {
    return Object.freeze(factsAtDifficulty(facts, difficulty));
  }

  function getWeakFacts(progress = {}, limit = 5) {
    const stats = normaliseProgress(progress);
    return facts.map((fact) => ({ fact, stat: stats[fact.key], accuracy: factAccuracy(stats[fact.key]), category: factCategory(stats[fact.key]) }))
      .filter(({ stat, category }) => stat.attempts > 0 && category !== "mastered")
      .sort((left, right) => left.accuracy - right.accuracy || right.stat.wrong - left.stat.wrong)
      .slice(0, limit);
  }

  function createSessionConfig({ mode = "student", selectedKeys = factKeys, difficulty = "easy", questionCount = 15 } = {}) {
    const selected = [...new Set((selectedKeys || []).filter((key) => factKeys.includes(key)))];
    return { mode: mode === "teacher" ? "teacher" : "student", selectedKeys: mode === "student" ? [...factKeys] : selected, difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : "easy", questionCount: mode === "student" ? 15 : (QUESTION_COUNTS.includes(Number(questionCount)) ? Number(questionCount) : 15) };
  }

  return { operation: normalizedOperation, info: operationInfo(normalizedOperation), facts, factKeys, createEmptyProgress, normaliseProgress, factAccuracy, factCategory, selectNextFact, recordFactOutcome, factDeltasFromOutcomes, getFactsForDifficulty, getWeakFacts, createSessionConfig, DIFFICULTIES, DIFFICULTY_INFO, QUESTION_COUNTS };
}

export function multiplicationSelectionFromNumbers(numbers) {
  return operationSelectionFromNumbers("darab", numbers);
}
