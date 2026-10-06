const STORAGE_KEY = "kembara-pintar-math-progress-v1";
const MATH_EVENT = "kembara:math-progress";

const OPERATIONS = ["tambah", "tolak"];
const LEVELS = ["easy", "medium", "challenge"];
const STAGES = ["learn", "main", "test"];

function readStore() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // The current session can still show progress when storage is blocked.
  }
}

function emptyLevel() {
  return { learn: false, main: false, test: false };
}

function normalizeLevels(levels) {
  return LEVELS.reduce((result, level) => {
    result[level] = { ...emptyLevel(), ...(levels?.[level] || {}) };
    return result;
  }, {});
}

export function getMathProgress(studentId, operation = "tambah") {
  const selectedOperation = OPERATIONS.includes(operation) ? operation : "tambah";
  const record = studentId ? readStore()[studentId] : null;
  // Older builds stored one shared journey. Keep it as tambah progress while
  // giving tolak a fresh journey so the operations can unlock independently.
  const levels = record?.operations?.[selectedOperation]?.levels
    || (selectedOperation === "tambah" ? record?.levels : {})
    || {};
  return {
    operation: selectedOperation,
    levels: normalizeLevels(levels)
  };
}

export function isMathLevelUnlocked(progress, level) {
  const levelIndex = LEVELS.indexOf(level);
  if (levelIndex <= 0) return true;
  return Boolean(progress?.levels?.[LEVELS[levelIndex - 1]]?.test);
}

export function isMathStageUnlocked(progress, level, stage) {
  if (!isMathLevelUnlocked(progress, level)) return false;
  const stageIndex = STAGES.indexOf(stage);
  if (stageIndex <= 0) return true;
  return Boolean(progress?.levels?.[level]?.[STAGES[stageIndex - 1]]);
}

export function completeMathStage(studentId, operation, level, stage) {
  const selectedOperation = OPERATIONS.includes(operation) ? operation : "tambah";
  if (!studentId || !level || !stage || !STAGES.includes(stage)) return getMathProgress(studentId, selectedOperation);
  const store = readStore();
  const current = getMathProgress(studentId, selectedOperation);
  const nextLevels = {
    ...current.levels,
    [level]: { ...current.levels[level], [stage]: true }
  };
  const previousRecord = store[studentId] || {};
  const legacyTambah = previousRecord.levels && !previousRecord.operations?.tambah
    ? { levels: normalizeLevels(previousRecord.levels) }
    : null;
  const next = {
    ...previousRecord,
    operations: {
      ...(legacyTambah ? { tambah: legacyTambah } : {}),
      ...(previousRecord.operations || {}),
      [selectedOperation]: { levels: nextLevels }
    },
    updatedAt: new Date().toISOString()
  };
  delete next.levels;
  store[studentId] = next;
  writeStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MATH_EVENT, { detail: { studentId, operation: selectedOperation, level, stage } }));
  }
  return getMathProgress(studentId, selectedOperation);
}

export function subscribeToMathProgress(listener) {
  if (typeof window === "undefined") return () => {};
  const handleProgress = (event) => listener(event.detail);
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) listener(null);
  };
  window.addEventListener(MATH_EVENT, handleProgress);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(MATH_EVENT, handleProgress);
    window.removeEventListener("storage", handleStorage);
  };
}

export { OPERATIONS, LEVELS, STAGES, STORAGE_KEY };
