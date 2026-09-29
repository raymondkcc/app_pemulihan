import test from "node:test";
import assert from "node:assert/strict";
import { createOperationEngine, multiplicationSelectionFromNumbers, operationSelectionFromNumbers, OPERATION_KEYS, operationInfo } from "./zombieDefenseFacts.js";

test("universal engine exposes all four operations with operation-aware facts", () => {
  assert.deepEqual(OPERATION_KEYS, ["tambah", "tolak", "darab", "bahagi"]);
  assert.equal(operationInfo("tambah").symbol, "+");
  assert.equal(operationInfo("tolak").symbol, "−");
  assert.equal(operationInfo("darab").symbol, "×");
  assert.equal(operationInfo("bahagi").symbol, "÷");
  for (const operation of OPERATION_KEYS) {
    const engine = createOperationEngine(operation);
    assert.ok(engine.facts.length > 0);
    assert.equal(engine.facts.every((fact) => fact.operation === operation || operation === "darab"), true);
  }
});

test("teacher multiplication number 9 selects both ordered directions without duplicating 9x9", () => {
  const keys = multiplicationSelectionFromNumbers([9]);
  assert.equal(keys.length, 17);
  assert.equal(new Set(keys).size, 17);
  assert.ok(keys.includes("9x1"));
  assert.ok(keys.includes("1x9"));
  assert.ok(keys.includes("9x9"));
});

test("teacher number selection filters each universal operation", () => {
  const addition = operationSelectionFromNumbers("tambah", [9]);
  assert.ok(addition.includes("9+1"));
  assert.ok(addition.includes("1+9"));

  const subtraction = operationSelectionFromNumbers("tolak", [9]);
  assert.ok(subtraction.includes("9-1"));
  assert.ok(subtraction.includes("9-9"));
  assert.ok(!subtraction.includes("8-9"));

  const division = operationSelectionFromNumbers("bahagi", [9]);
  assert.ok(division.includes("9/1"));
  assert.ok(division.includes("81/9"));
  assert.ok(!division.includes("8/1"));
});

test("student mode ignores a provided number-derived filter", () => {
  const engine = createOperationEngine("darab");
  const question = engine.selectNextFact({ mode: "student", selectedKeys: ["1x1"], rng: () => 0.4 });
  assert.notEqual(question, null);
  assert.notEqual(question.key, "1x1");
});

test("teacher mode stays inside selected generic operation facts", () => {
  const engine = createOperationEngine("bahagi");
  const selected = engine.facts.slice(0, 2).map((fact) => fact.key);
  for (let index = 0; index < 40; index += 1) {
    const question = engine.selectNextFact({ mode: "teacher", selectedKeys: selected, previousKey: index ? selected[(index - 1) % selected.length] : null, rng: () => 0.2 });
    assert.ok(selected.includes(question.key));
  }
});

test("addition difficulty pools are cumulative and respect the requested boundaries", () => {
  const engine = createOperationEngine("tambah");
  const easyKeys = new Set(engine.getFactsForDifficulty("easy").map((fact) => fact.key));
  const mediumKeys = new Set(engine.getFactsForDifficulty("medium").map((fact) => fact.key));
  const hardKeys = new Set(engine.getFactsForDifficulty("hard").map((fact) => fact.key));

  assert.ok(easyKeys.has("9+8"));
  assert.ok(!easyKeys.has("9+9"), "easy excludes totals of 18");
  assert.ok(easyKeys.has("1+1"));
  assert.ok([...easyKeys].every((key) => {
    const fact = engine.facts.find((item) => item.key === key);
    return fact.first < 10 && fact.second < 10 && fact.answer < 18;
  }));

  assert.ok(easyKeys.isSubsetOf(mediumKeys));
  assert.ok(mediumKeys.has("9+9"));
  assert.ok(mediumKeys.has("10+5"));
  assert.ok(mediumKeys.has("19+3"));
  assert.ok(!mediumKeys.has("19+4"), "two-digit plus one-digit totals stop below 23");
  assert.ok(hardKeys.has("20+30"));
  assert.ok(hardKeys.has("99+98"));
  assert.ok(mediumKeys.isSubsetOf(hardKeys));
});

test("subtraction difficulty pools are cumulative and include tens/fives at hard", () => {
  const engine = createOperationEngine("tolak");
  const easyKeys = new Set(engine.getFactsForDifficulty("easy").map((fact) => fact.key));
  const mediumKeys = new Set(engine.getFactsForDifficulty("medium").map((fact) => fact.key));
  const hardKeys = new Set(engine.getFactsForDifficulty("hard").map((fact) => fact.key));

  assert.ok(easyKeys.has("9-1"));
  assert.ok(!easyKeys.has("10-1"));
  assert.ok([...easyKeys].every((key) => {
    const fact = engine.facts.find((item) => item.key === key);
    return fact.first < 10 && fact.second < 10 && fact.answer >= 0 && fact.answer < 10;
  }));

  assert.ok(easyKeys.isSubsetOf(mediumKeys));
  assert.ok(mediumKeys.has("10-1"));
  assert.ok(mediumKeys.has("24-7"));
  assert.ok(!mediumKeys.has("25-7"), "medium answers stay below 18");
  assert.ok(mediumKeys.isSubsetOf(hardKeys));
  assert.ok(hardKeys.has("25-5"));
  assert.ok(hardKeys.has("99-10"));
  assert.ok(hardKeys.has("95-5"));
});

test("difficulty selection stays inside the active operation pool", () => {
  for (const [operation, difficulty] of [["tambah", "easy"], ["tambah", "medium"], ["tambah", "hard"], ["tolak", "easy"], ["tolak", "medium"], ["tolak", "hard"]]) {
    const engine = createOperationEngine(operation);
    const allowed = new Set(engine.getFactsForDifficulty(difficulty).map((fact) => fact.key));
    for (let index = 0; index < 40; index += 1) {
      const question = engine.selectNextFact({ mode: "teacher", selectedKeys: engine.factKeys, difficulty, previousKey: index ? undefined : null, rng: () => (index % 9) / 9 });
      assert.ok(question);
      assert.ok(allowed.has(question.key), `${operation} ${difficulty} selected ${question.key}`);
    }
  }
});

test("generic session config keeps student sessions at 15 and teacher counts constrained", () => {
  const engine = createOperationEngine("tambah");
  assert.equal(engine.createSessionConfig({ mode: "student", questionCount: 50 }).questionCount, 15);
  assert.equal(engine.createSessionConfig({ mode: "teacher", selectedKeys: [engine.factKeys[0]], questionCount: 30 }).questionCount, 30);
  assert.equal(engine.createSessionConfig({ mode: "teacher", selectedKeys: [engine.factKeys[0]], questionCount: 99 }).questionCount, 15);
});
