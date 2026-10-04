import { createEmptyProgress, normaliseProgress } from "./multiplicationFacts.js";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "../../utils/firebase.js";

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

function remoteFactRecord(stat) {
  return {
    attempts: Number(stat.attempts) || 0,
    correct: Number(stat.correct) || 0,
    wrong: Number(stat.wrong) || 0,
    currentStreak: Number(stat.currentStreak) || 0,
    lastResult: stat.lastResult === "correct" || stat.lastResult === "wrong" ? stat.lastResult : null,
    lastAnsweredAt: stat.lastAnsweredAt || null,
    nextDueAt: stat.nextDueAt || null
  };
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
  if (!studentId || !auth.currentUser) return { ok: true, localOnly: true, local };
  try {
    const factWrites = Object.entries(normaliseProgress(progress)).map(([key, stat]) => setDoc(
      doc(db, "students", studentId, "multiplicationFacts", key),
      remoteFactRecord(stat),
      { merge: true }
    ));
    await Promise.all([
      ...factWrites,
      setDoc(doc(db, "students", studentId, "multiplicationSessions", summary.sessionId), {
        ...summary,
        studentId,
        factDeltas,
        outcomes,
        savedAt: new Date().toISOString()
      }, { merge: true })
    ]);
    return { ok: true, localOnly: false, local };
  } catch (error) {
    return { ok: true, localOnly: true, local, error };
  }
}

export async function loadMultiplicationReport(studentId) {
  if (!studentId) return [];
  try {
    const snapshot = await getDocs(collection(db, "students", studentId, "multiplicationFacts"));
    if (snapshot.docs.length) return snapshot.docs.map((item) => ({ key: item.id, ...item.data() }));
  } catch {
    // Fall back to the device copy when offline or before rules are deployed.
  }
  const local = readLocal(studentId);
  return Object.entries(local.progress || {}).map(([key, stat]) => ({ key, ...stat }));
}
