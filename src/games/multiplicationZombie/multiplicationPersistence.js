import { createEmptyProgress, normaliseProgress } from "./multiplicationFacts.js";

const STORAGE_PREFIX = "pemulihan-multiplication-zombie-v1";

function storageKey(studentId) {
  return `${STORAGE_PREFIX}:${studentId || "guest"}`;
}

function readLocal(studentId) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(studentId)) || "null");
    return parsed && typeof parsed === "object" ? parsed : { progress: createEmptyProgress(), sessions: [] };
  } catch {
    return { progress: createEmptyProgress(), sessions: [] };
  }
}

function writeLocal(studentId, value) {
  try { window.localStorage.setItem(storageKey(studentId), JSON.stringify(value)); } catch { /* private browsing fallback */ }
  return value;
}

export function mergeMultiplicationProgress(left, right) {
  const first = normaliseProgress(left);
  const second = normaliseProgress(right);
  return Object.fromEntries(Object.keys(first).map((key) => {
    const a = first[key];
    const b = second[key];
    const aTime = Date.parse(a.lastAnsweredAt || "") || 0;
    const bTime = Date.parse(b.lastAnsweredAt || "") || 0;
    const latest = bTime >= aTime ? b : a;
    return [key, {
      ...latest,
      attempts: Math.max(a.attempts, b.attempts),
      correct: Math.max(a.correct, b.correct),
      wrong: Math.max(a.wrong, b.wrong),
      currentStreak: latest.currentStreak,
      lastResult: latest.lastResult,
      lastAnsweredAt: latest.lastAnsweredAt,
      nextDueAt: latest.nextDueAt
    }];
  }));
}

export function loadMultiplicationProgress(student) {
  const studentId = student?.id || "guest";
  const local = readLocal(studentId);
  const remote = student?.progress?.multiplicationFacts || {};
  return mergeMultiplicationProgress(local.progress, remote);
}

function localSessionRecord({ summary, factDeltas = {}, outcomes = [] }) {
  return {
    ...summary,
    factDeltas,
    outcomes: Array.isArray(outcomes) ? outcomes : [],
    savedAt: new Date().toISOString(),
    syncState: "local"
  };
}

export function saveLocalMultiplicationSession({ studentId, progress, factDeltas = {}, outcomes = [], summary }) {
  const current = readLocal(studentId);
  const record = localSessionRecord({ summary, factDeltas, outcomes });
  const existing = Array.isArray(current.sessions) ? current.sessions : [];
  const sessions = [...existing.filter((item) => item.sessionId !== record.sessionId), record].slice(-20);
  const next = { progress: normaliseProgress(progress), sessions };
  writeLocal(studentId, next);
  return next;
}

export async function persistMultiplicationSession({ studentId, progress, factDeltas, outcomes = [], summary } = {}) {
  const local = saveLocalMultiplicationSession({ studentId, progress, factDeltas, outcomes, summary });
  return { ok: true, localOnly: true, local };
}

export async function loadMultiplicationReport(studentId) {
  if (!studentId) return [];
  const local = readLocal(studentId);
  return Object.entries(local.progress || {}).map(([key, stat]) => ({ key, ...stat }));
}
