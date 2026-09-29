const STORAGE_PREFIX = "pemulihan-zombie-defense-v1";

function storageKey(studentId, operation) {
  return `${STORAGE_PREFIX}:${operation}:${studentId || "guest"}`;
}

function readLocal(studentId, operation, createEmptyProgress) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(studentId, operation)) || "null");
    return parsed && typeof parsed === "object" ? parsed : { progress: createEmptyProgress(), sessions: [] };
  } catch {
    return { progress: createEmptyProgress(), sessions: [] };
  }
}

function writeLocal(studentId, operation, value) {
  try { window.localStorage.setItem(storageKey(studentId, operation), JSON.stringify(value)); } catch { /* localStorage is optional */ }
  return value;
}

export function mergeZombieDefenseProgress(engine, left = {}, right = {}) {
  const first = engine.normaliseProgress(left);
  const second = engine.normaliseProgress(right);
  return Object.fromEntries(Object.keys(first).map((key) => {
    const a = first[key];
    const b = second[key];
    const aTime = Date.parse(a.lastAnsweredAt || "") || 0;
    const bTime = Date.parse(b.lastAnsweredAt || "") || 0;
    const latest = bTime >= aTime ? b : a;
    return [key, { ...latest, attempts: Math.max(a.attempts, b.attempts), correct: Math.max(a.correct, b.correct), wrong: Math.max(a.wrong, b.wrong) }];
  }));
}

export function loadZombieDefenseProgress(engine, student, operation) {
  const studentId = student?.id || "guest";
  const local = readLocal(studentId, operation, engine.createEmptyProgress);
  return mergeZombieDefenseProgress(engine, local.progress, student?.progress?.[`${operation}Facts`] || {});
}

export function saveZombieDefenseSession({ engine, studentId, operation, progress, outcomes = [], summary }) {
  const current = readLocal(studentId, operation, engine.createEmptyProgress);
  const record = { ...summary, operation, outcomes, factDeltas: engine.factDeltasFromOutcomes(outcomes), savedAt: new Date().toISOString() };
  const sessions = [...(Array.isArray(current.sessions) ? current.sessions : []).filter((item) => item.sessionId !== record.sessionId), record].slice(-20);
  return writeLocal(studentId, operation, { progress: engine.normaliseProgress(progress), sessions });
}
