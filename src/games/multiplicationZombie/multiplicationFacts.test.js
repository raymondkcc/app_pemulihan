import test from "node:test";
import assert from "node:assert/strict";
import {
  DIFFICULTIES,
  FACTS,
  FACT_KEYS,
  createEmptyProgress,
  createSessionConfig,
  factAccuracy,
  factCategory,
  factDeltasFromOutcomes,
  getNextDifficulty,
  recordFactOutcome,
  selectNextFact
} from "./multiplicationFacts.js";

function masteredStat() {
  return {
    attempts: 6,
    correct: 6,
    wrong: 0,
    currentStreak: 6,
    lastResult: "correct",
    lastAnsweredAt: "2026-09-26T10:00:00.000Z",
    nextDueAt: "2099-01-01T00:00:00.000Z"
  };
}

function withStats(overrides = {}) {
  const progress = createEmptyProgress();
  Object.entries(overrides).forEach(([key, value]) => {
    progress[key] = { ...progress[key], ...value };
  });
  return progress;
}

test("generates 81 ordered facts and keeps reverse facts separate", () => {
  assert.equal(FACTS.length, 81);
  assert.equal(new Set(FACT_KEYS).size, 81);
  assert.deepEqual(FACTS.find((fact) => fact.key === "3x4"), {
    key: "3x4", first: 3, second: 4, answer: 12
  });
  assert.deepEqual(FACTS.find((fact) => fact.key === "4x3"), {
    key: "4x3", first: 4, second: 3, answer: 12
  });
});

test("teacher selection never leaves the selected fact pool", () => {
  const selected = ["3x4", "4x3"];
  let previousKey = null;
  for (let index = 0; index < 80; index += 1) {
    const next = selectNextFact({ mode: "teacher", selectedKeys: selected, previousKey, rng: () => (index % 7) / 7 });
    assert.ok(selected.includes(next.key));
    previousKey = next.key;
  }
});

test("student selection ignores a learner-provided fact filter", () => {
  const next = selectNextFact({ mode: "student", selectedKeys: ["1x1"], rng: () => 0.999 });
  assert.notEqual(next.key, "1x1");
  assert.equal(FACT_KEYS.includes(next.key), true);
});

test("weak facts receive more adaptive selections than mastered facts", () => {
  const progress = withStats({
    "1x1": { attempts: 5, correct: 1, wrong: 4, currentStreak: 0, lastResult: "wrong", nextDueAt: "2026-09-26T00:00:00.000Z" },
    "2x2": masteredStat()
  });
  let seed = 17;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  let weak = 0;
  let mastered = 0;
  for (let index = 0; index < 1000; index += 1) {
    const next = selectNextFact({ mode: "student", progress, rng });
    if (next.key === "1x1") weak += 1;
    if (next.key === "2x2") mastered += 1;
  }
  assert.ok(weak > mastered * 2, `expected weak=${weak} to be more frequent than mastered=${mastered}`);
});

test("recently incorrect facts can be reintroduced immediately after an alternative", () => {
  const progress = withStats({
    "3x4": { attempts: 1, correct: 0, wrong: 1, lastResult: "wrong", nextDueAt: "2026-09-26T00:00:00.000Z" },
    "4x4": masteredStat()
  });
  const next = selectNextFact({ mode: "student", progress, previousKey: "4x4", rng: () => 0 });
  assert.equal(next.key, "3x4");
});

test("new facts remain available for sampling", () => {
  const progress = createEmptyProgress();
  FACT_KEYS.filter((key) => key !== "9x9").forEach((key) => { progress[key] = masteredStat(); });
  const next = selectNextFact({ mode: "student", progress, rng: () => 0.75 });
  assert.equal(next.key, "9x9");
});

test("immediate duplicates are avoided when another fact exists", () => {
  const next = selectNextFact({ mode: "student", previousKey: "1x1", rng: () => 0.2 });
  assert.notEqual(next.key, "1x1");
});

test("recording an outcome updates streak, accuracy, and due time", () => {
  const first = recordFactOutcome(createEmptyProgress(), "3x4", true, Date.parse("2026-09-27T00:00:00.000Z"));
  assert.equal(first["3x4"].attempts, 1);
  assert.equal(first["3x4"].correct, 1);
  assert.equal(first["3x4"].currentStreak, 1);
  assert.equal(first["3x4"].lastResult, "correct");
  assert.equal(factAccuracy(first["3x4"]), 1);
  assert.equal(factCategory(first["3x4"], Date.parse("2026-09-27T00:01:00.000Z")), "new");
  const second = recordFactOutcome(first, "3x4", false, Date.parse("2026-09-27T00:02:00.000Z"));
  assert.equal(second["3x4"].wrong, 1);
  assert.equal(second["3x4"].currentStreak, 0);
  assert.equal(second["3x4"].nextDueAt, "2026-09-27T00:02:00.000Z");
});

test("fact deltas preserve per-fact totals and final result", () => {
  assert.deepEqual(factDeltasFromOutcomes([
    { factKey: "3x4", correct: false },
    { factKey: "3x4", correct: true },
    { factKey: "4x3", correct: false }
  ]), {
    "3x4": { attempts: 2, correct: 1, wrong: 1, lastResult: "correct" },
    "4x3": { attempts: 1, correct: 0, wrong: 1, lastResult: "wrong" }
  });
});

test("session configuration enforces teacher counts and student defaults", () => {
  assert.deepEqual(DIFFICULTIES, ["easy", "medium", "hard"]);
  assert.equal(createSessionConfig({ mode: "teacher", selectedKeys: ["3x4"], questionCount: 30 }).questionCount, 30);
  assert.equal(createSessionConfig({ mode: "teacher", selectedKeys: ["3x4"], questionCount: 99 }).questionCount, 15);
  const student = createSessionConfig({ mode: "student", selectedKeys: ["1x1"], questionCount: 50, difficulty: "hard" });
  assert.equal(student.questionCount, 15);
  assert.equal(student.selectedKeys.length, 81);
  assert.equal(student.difficulty, "hard");
});

test("adaptive difficulty moves up after sustained success and down after errors", () => {
  assert.equal(getNextDifficulty("easy", { consecutiveCorrect: 4 }), "medium");
  assert.equal(getNextDifficulty("medium", { consecutiveCorrect: 4 }), "hard");
  assert.equal(getNextDifficulty("hard", { consecutiveCorrect: 4 }), "hard");
  assert.equal(getNextDifficulty("hard", { consecutiveWrong: 2 }), "medium");
  assert.equal(getNextDifficulty("easy", { consecutiveWrong: 2 }), "easy");
});
