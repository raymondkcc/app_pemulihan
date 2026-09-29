import { onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, firebaseApp, secondaryApp, secondaryAuth, secondaryDb } from "../../utils/firebase.js";
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
    syncState: "pending"
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

function markLocalSessionSynced(studentId, sessionId) {
  const current = readLocal(studentId);
  const sessions = (Array.isArray(current.sessions) ? current.sessions : []).map((session) => (
    session.sessionId === sessionId ? { ...session, syncState: "saved", syncedAt: new Date().toISOString() } : session
  ));
  return writeLocal(studentId, { ...current, sessions });
}

async function sendMultiplicationSession({ studentId, factDeltas, outcomes = [], summary }) {
  const functions = getFunctions(secondaryApp);
  const record = httpsCallable(functions, "recordMultiplicationSession", { timeout: 4500 });
  return record({ studentId, factDeltas, outcomes, summary });
}

export async function retryPendingMultiplicationSessions(studentId) {
  if (!studentId || studentId === "guest") return { ok: false, processed: 0, pending: 0 };
  const pending = readLocal(studentId).sessions.filter((session) => session.syncState !== "saved" && session.sessionId && session.factDeltas && Array.isArray(session.outcomes));
  let processed = 0;
  let error = null;
  for (const session of pending) {
    try {
      await sendMultiplicationSession({
        studentId,
        factDeltas: session.factDeltas || {},
        outcomes: session.outcomes || [],
        summary: session
      });
      markLocalSessionSynced(studentId, session.sessionId);
      processed += 1;
    } catch (nextError) {
      error = nextError;
      break;
    }
  }
  return { ok: processed === pending.length, processed, pending: pending.length - processed, error };
}

export async function establishStudentPracticeSession({ studentId, studentCode = "", pictureIds = [] } = {}) {
  if (!studentId) return { ok: false, reason: "missing-student" };
  try {
    const functions = getFunctions(secondaryApp);
    const begin = httpsCallable(functions, "beginStudentPractice", { timeout: 4500 });
    const response = await begin({ studentId, studentCode, pictureIds });
    if (!response.data?.token) return { ok: false, reason: "missing-token" };
    await signInWithCustomToken(secondaryAuth, response.data.token);
    void retryPendingMultiplicationSessions(studentId).catch(() => {});
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "backend-unavailable", error };
  }
}

export async function persistMultiplicationSession({ studentId, progress, factDeltas, outcomes = [], summary } = {}) {
  const local = saveLocalMultiplicationSession({ studentId, progress, factDeltas, outcomes, summary });
  if (!studentId || studentId === "guest") return { ok: true, localOnly: true, local };

  const result = await retryPendingMultiplicationSessions(studentId);
  const latestLocal = readLocal(studentId);
  if (result.ok) {
    return { ok: true, localOnly: false, local: latestLocal };
  }
  // Keep the full payload locally so it can be retried after the practice token
  // or Functions endpoint becomes available again.
  return { ok: false, localOnly: true, local: latestLocal, error: result.error };
}

async function readMultiplicationReport(studentId) {
  const reportDb = secondaryAuth.currentUser?.uid === studentId ? secondaryDb : db;
  try {
    const snapshot = await getDocs(collection(reportDb, "students", studentId, "multiplicationFacts"));
    return snapshot.docs.map((item) => ({ key: item.id, ...item.data() }));
  } catch {
    return [];
  }
}

export async function loadMultiplicationReport(studentId) {
  if (!studentId) return [];
  const immediate = await readMultiplicationReport(studentId);
  if (immediate.length || secondaryAuth.currentUser?.uid === studentId) return immediate;

  // A restored student session may still be exchanging its short-lived
  // practice token while React mounts the route. Wait briefly for that auth
  // state before falling back to the empty report, otherwise a reload can
  // incorrectly hide already-saved facts from the adaptive selector/report.
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId;
    let unsubscribe = () => {};
    const finish = async () => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeoutId);
      unsubscribe();
      resolve(await readMultiplicationReport(studentId));
    };
    unsubscribe = onAuthStateChanged(secondaryAuth, (user) => {
      if (user?.uid === studentId) void finish();
    });
    timeoutId = globalThis.setTimeout(() => void finish(), 4500);
  });
}

export function hasStudentPracticeSession() {
  return Boolean(secondaryAuth.currentUser);
}

export { firebaseApp };
