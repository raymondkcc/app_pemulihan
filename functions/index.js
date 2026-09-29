const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

admin.initializeApp();
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

const db = admin.firestore();
const FACT_KEY = /^[1-9]x[1-9]$/;
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_REASONS = new Set(["complete", "brain"]);
const VALID_COUNTS = new Set([15, 30, 50]);

function text(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normaliseStudentCode(value) {
  return text(value, 80).toUpperCase();
}

function hashSecret(value) {
  let hash = 5381;
  const source = String(value);
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) + hash) + source.charCodeAt(index);
  }
  return `k1-${(hash >>> 0).toString(16)}-${source.length}`;
}

function isPictureProofValid(student, pictureIds) {
  if (!Array.isArray(pictureIds) || pictureIds.length !== 2) return false;
  const ids = pictureIds.map((value) => text(value, 80));
  if (ids.some((value) => !value)) return false;
  if (student.lockHash) return student.lockHash === hashSecret(ids.join("|"));
  return Array.isArray(student.lock)
    && student.lock.length === 2
    && student.lock[0] === ids[0]
    && student.lock[1] === ids[1];
}

async function getActiveStudent(studentId) {
  const id = text(studentId, 128);
  if (!id || id.includes("/") || id !== studentId) {
    throw new HttpsError("invalid-argument", "Murid tidak sah.");
  }
  const snapshot = await db.doc(`students/${id}`).get();
  if (!snapshot.exists || snapshot.data()?.archived || snapshot.data()?.locked) {
    throw new HttpsError("permission-denied", "Murid tidak tersedia.");
  }
  return { id, data: snapshot.data() || {} };
}

function hasStudentProof(student, data) {
  const submittedCode = normaliseStudentCode(data.studentCode);
  const storedCode = normaliseStudentCode(student.data.studentCode || student.data.kadCode);
  if (submittedCode && storedCode && submittedCode === storedCode) return true;
  return isPictureProofValid(student.data, data.pictureIds);
}

function assertStudentToken(request, studentId) {
  const auth = request.auth;
  if (!auth
    || auth.uid !== studentId
    || auth.token?.practice !== true
    || auth.token?.studentId !== studentId) {
    throw new HttpsError("permission-denied", "Sesi latihan murid tidak sah.");
  }
}

function validFactDelta(key, value) {
  if (!FACT_KEY.test(key) || !value || typeof value !== "object") return null;
  const attempts = Number(value.attempts);
  const correct = Number(value.correct);
  const wrong = Number(value.wrong);
  if (![attempts, correct, wrong].every((item) => Number.isInteger(item) && item >= 0 && item <= 1000)) return null;
  if (attempts !== correct + wrong || attempts === 0) return null;
  const lastResult = value.lastResult === "correct" || value.lastResult === "wrong" ? value.lastResult : null;
  return { attempts, correct, wrong, lastResult };
}

function parseDeltas(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpsError("invalid-argument", "Analisis fakta tidak sah.");
  }
  const deltas = {};
  for (const [key, value] of Object.entries(input)) {
    if (Object.keys(deltas).length >= 81) {
      throw new HttpsError("invalid-argument", "Terlalu banyak fakta.");
    }
    const delta = validFactDelta(key, value);
    if (!delta) throw new HttpsError("invalid-argument", `Delta fakta tidak sah: ${key}.`);
    deltas[key] = delta;
  }
  return deltas;
}

function parseOutcomes(input) {
  if (!Array.isArray(input) || input.length > 500) {
    throw new HttpsError("invalid-argument", "Jawapan sesi tidak sah.");
  }
  return input.map((item) => {
    const factKey = text(item?.factKey, 8);
    if (!FACT_KEY.test(factKey) || typeof item?.correct !== "boolean") {
      throw new HttpsError("invalid-argument", "Jawapan sesi tidak sah.");
    }
    return { factKey, correct: item.correct };
  });
}

function derivedDeltas(outcomes) {
  const result = {};
  outcomes.forEach(({ factKey, correct }) => {
    result[factKey] ||= { attempts: 0, correct: 0, wrong: 0, lastResult: null };
    result[factKey].attempts += 1;
    if (correct) result[factKey].correct += 1;
    else result[factKey].wrong += 1;
    result[factKey].lastResult = correct ? "correct" : "wrong";
  });
  return result;
}

function sameDeltas(left, right) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const a = left[key] || { attempts: 0, correct: 0, wrong: 0, lastResult: null };
    const b = right[key] || { attempts: 0, correct: 0, wrong: 0, lastResult: null };
    if (a.attempts !== b.attempts || a.correct !== b.correct || a.wrong !== b.wrong || a.lastResult !== b.lastResult) return false;
  }
  return true;
}

function safeTimestamp(value, fallback) {
  const parsed = Date.parse(value || "");
  if (!Number.isFinite(parsed)) return fallback;
  return new Date(Math.min(parsed, Date.now())).toISOString();
}

function sanitiseSummary(input = {}) {
  const questionCount = Number(input.questionCount);
  const answered = Number(input.answered);
  const correct = Number(input.correct);
  const wrong = Number(input.wrong);
  if (input.mode !== "student"
    || questionCount !== 15
    || !VALID_COUNTS.has(questionCount)
    || ![answered, correct, wrong].every((item) => Number.isInteger(item) && item >= 0 && item <= 500)
    || correct + wrong !== answered
    || answered > questionCount
    || input.difficultyStart !== "easy"
    || !VALID_DIFFICULTIES.has(input.difficultyEnd)
    || !VALID_REASONS.has(input.reason)) {
    throw new HttpsError("invalid-argument", "Ringkasan sesi tidak sah.");
  }
  const sessionId = text(input.sessionId, 120);
  const startedAt = safeTimestamp(input.startedAt, new Date().toISOString());
  const endedAt = safeTimestamp(input.endedAt, new Date().toISOString());
  return {
    sessionId: sessionId || null,
    mode: "student",
    questionCount,
    answered,
    correct,
    wrong,
    accuracy: answered ? correct / answered : 0,
    waves: Math.max(0, Math.min(500, Number(input.waves) || 0)),
    difficultyStart: input.difficultyStart,
    difficultyEnd: input.difficultyEnd,
    reason: input.reason,
    startedAt,
    endedAt,
    receivedAt: FieldValue.serverTimestamp()
  };
}

function nextDueAt(lastResult, currentStreak) {
  const delay = lastResult === "correct" && currentStreak >= 3
    ? 24 * 60 * 60 * 1000
    : lastResult === "correct" ? 15 * 60 * 1000 : 0;
  return new Date(Date.now() + delay).toISOString();
}

function sessionDocumentId(sessionId) {
  return /^[A-Za-z0-9_-]{1,120}$/.test(sessionId || "") ? sessionId : db.collection("_ids").doc().id;
}

exports.beginStudentPractice = onCall(async (request) => {
  const student = await getActiveStudent(request.data?.studentId);
  if (!hasStudentProof(student, request.data || {})) {
    throw new HttpsError("permission-denied", "Bukti murid tidak sepadan.");
  }
  const token = await admin.auth().createCustomToken(student.id, {
    practice: true,
    studentId: student.id
  });
  return { token, expiresInSeconds: 3600 };
});

exports.recordMultiplicationSession = onCall(async (request) => {
  const studentId = text(request.data?.studentId, 128);
  assertStudentToken(request, studentId);
  await getActiveStudent(studentId);

  const deltas = parseDeltas(request.data?.factDeltas || {});
  const outcomes = parseOutcomes(request.data?.outcomes);
  const summary = sanitiseSummary(request.data?.summary || {});
  if (outcomes.length !== summary.answered || !sameDeltas(deltas, derivedDeltas(outcomes))) {
    throw new HttpsError("invalid-argument", "Jawapan sesi tidak sepadan dengan ringkasan.");
  }
  const totalDeltaAttempts = Object.values(deltas).reduce((sum, delta) => sum + delta.attempts, 0);
  if (totalDeltaAttempts !== summary.answered) {
    throw new HttpsError("invalid-argument", "Jumlah jawapan tidak sepadan dengan delta.");
  }
  const sessions = db.collection("students").doc(studentId).collection("multiplicationSessions");
  const sessionRef = sessions.doc(sessionDocumentId(summary.sessionId));
  const factRefs = Object.keys(deltas).map((key) => db.collection("students").doc(studentId).collection("multiplicationFacts").doc(key));

  const result = await db.runTransaction(async (transaction) => {
    const existingSession = await transaction.get(sessionRef);
    if (existingSession.exists) return { duplicate: true };
    const snapshots = await Promise.all(factRefs.map((ref) => transaction.get(ref)));
    const now = new Date().toISOString();
    const outcomesByFact = outcomes.reduce((map, outcome) => {
      (map[outcome.factKey] ||= []).push(outcome);
      return map;
    }, {});

    snapshots.forEach((snapshot, index) => {
      const key = Object.keys(deltas)[index];
      const delta = deltas[key];
      const previous = snapshot.exists ? snapshot.data() || {} : {};
      const attempts = Number(previous.attempts) || 0;
      const correct = Number(previous.correct) || 0;
      const wrong = Number(previous.wrong) || 0;
      let currentStreak = Math.max(0, Number(previous.currentStreak) || 0);
      let lastResult = previous.lastResult === "correct" || previous.lastResult === "wrong" ? previous.lastResult : null;
      const factOutcomes = outcomesByFact[key] || [];
      if (factOutcomes.length) {
        factOutcomes.forEach((outcome) => {
          currentStreak = outcome.correct ? currentStreak + 1 : 0;
          lastResult = outcome.correct ? "correct" : "wrong";
        });
      } else {
        currentStreak = delta.lastResult === "wrong" ? 0 : currentStreak + delta.correct;
        lastResult = delta.lastResult;
      }
      transaction.set(factRefs[index], {
        attempts: attempts + delta.attempts,
        correct: correct + delta.correct,
        wrong: wrong + delta.wrong,
        currentStreak,
        lastResult,
        lastAnsweredAt: now,
        nextDueAt: nextDueAt(lastResult, currentStreak),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    });
    transaction.set(sessionRef, {
      ...summary,
      studentId,
      savedAt: FieldValue.serverTimestamp()
    });
    return { duplicate: false };
  });

  return { ok: true, duplicate: result.duplicate, sessionId: sessionRef.id };
});
