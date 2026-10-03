const admin = require("firebase-admin");
const crypto = require("crypto");
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
const QR_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const ASSESSMENT_SKILLS = new Set([
  "huruf",
  "vokal",
  "suku-kata-kv",
  "suku-kata-kvk",
  "perkataan",
  "tambah",
  "tolak",
  "darab",
  "bahagi"
]);

function text(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normaliseStudentCode(value) {
  return text(value, 80).toUpperCase();
}

function hashQrToken(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function assertAdmin(request) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Log masuk admin diperlukan.");
  return db.doc(`adults/${request.auth.uid}`).get().then((snapshot) => {
    if (!snapshot.exists || snapshot.data()?.active !== true || snapshot.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Hanya admin boleh melakukan operasi ini.");
    }
    return snapshot.data() || {};
  });
}

function assertAdultCanManageStudent(request, student) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Log masuk diperlukan.");
  const actorId = request.auth.uid;
  const actorPromise = db.doc(`adults/${actorId}`).get();
  return actorPromise.then((snapshot) => {
    const actor = snapshot.data() || {};
    if (!snapshot.exists || actor.active !== true || (actor.role !== "admin" && student.ownerId !== actorId)) {
      throw new HttpsError("permission-denied", "Anda tidak boleh mengurus murid ini.");
    }
    return actor;
  });
}

function safeAdult(id, data) {
  return {
    id,
    name: text(data.name, 40),
    email: text(data.email, 160).toLowerCase(),
    role: ["admin", "teacher", "parent"].includes(data.role) ? data.role : "teacher",
    plan: data.plan === "plus" ? "plus" : "free",
    studentLimit: Math.max(1, Math.min(500, Number(data.studentLimit) || 10)),
    active: data.active !== false,
    createdAt: data.createdAt || new Date().toISOString()
  };
}

function safeStudent(id, data) {
  return {
    id,
    ownerId: data.ownerId || "",
    classId: data.classId || "",
    nickname: text(data.nickname, 18),
    avatarId: text(data.avatarId, 80) || "bintang",
    track: ["bm", "math", "both"].includes(data.track) ? data.track : "both",
    studentCode: normaliseStudentCode(data.studentCode || data.kadCode),
    kadCode: data.kadCode || null,
    archived: Boolean(data.archived),
    locked: Boolean(data.locked),
    hasLock: Boolean(data.hasLock || data.lockHash || data.lock)
  };
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

function parseAssessment(data = {}) {
  const subject = data.subject === "bm" || data.subject === "math" ? data.subject : "";
  const skillId = text(data.skillId, 80);
  const score = Number(data.score);
  const total = Number(data.total);
  if (!subject || !ASSESSMENT_SKILLS.has(skillId)
    || (subject === "bm" && !["huruf", "vokal", "suku-kata-kv", "suku-kata-kvk", "perkataan"].includes(skillId))
    || (subject === "math" && !["tambah", "tolak", "darab", "bahagi"].includes(skillId))
    || !Number.isInteger(score) || !Number.isInteger(total)
    || total < 1 || total > 100 || score < 0 || score > total) {
    throw new HttpsError("invalid-argument", "Keputusan Ujian tidak sah.");
  }
  return { subject, skillId, score, total, percentage: Math.round((score / total) * 100), passed: score === total };
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

async function deleteDocumentTree(reference) {
  const childCollections = await reference.listCollections();
  for (const childCollection of childCollections) {
    const snapshot = await childCollection.get();
    for (const child of snapshot.docs) await deleteDocumentTree(child.ref);
  }
  await reference.delete();
}

exports.updateAdultAccount = onCall(async (request) => {
  await assertAdmin(request);
  const adultId = text(request.data?.adultId, 128);
  if (!adultId || adultId.includes("/")) throw new HttpsError("invalid-argument", "Akaun tidak sah.");

  const adultRef = db.doc(`adults/${adultId}`);
  const snapshot = await adultRef.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Akaun tidak jumpa.");

  const current = snapshot.data() || {};
  const name = text(request.data?.name, 40);
  const email = text(request.data?.email, 160).toLowerCase();
  const role = ["admin", "teacher", "parent"].includes(request.data?.role)
    ? request.data.role
    : current.role || "teacher";
  if (adultId === request.auth.uid && (request.data?.active === false || role !== "admin")) {
    throw new HttpsError("failed-precondition", "Admin semasa mesti kekal aktif sebagai admin.");
  }
  if (!name || !email || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Nama dan e-mel diperlukan.");
  }

  const authPatch = { displayName: name, email, disabled: request.data?.active === false };
  const password = text(request.data?.password, 128);
  if (password) {
    if (password.length < 6) throw new HttpsError("invalid-argument", "Kata laluan mesti sekurang-kurangnya 6 aksara.");
    authPatch.password = password;
  }
  try {
    await admin.auth().updateUser(adultId, authPatch);
  } catch (error) {
    if (error.code === "auth/email-already-exists") throw new HttpsError("already-exists", "E-mel ini sudah ada.");
    throw new HttpsError("failed-precondition", error.message || "Akaun Auth tidak dapat dikemas kini.");
  }

  const next = {
    ...current,
    name,
    email,
    role,
    active: request.data?.active !== false,
    studentLimit: Math.max(1, Math.min(500, Number(request.data?.studentLimit) || Number(current.studentLimit) || 10)),
    plan: (Number(request.data?.studentLimit) || Number(current.studentLimit) || 10) > 10 ? "plus" : "free",
    updatedAt: new Date().toISOString()
  };
  await adultRef.set(next, { merge: true });
  return { ok: true, adult: safeAdult(adultId, next) };
});

exports.deleteAdultAccount = onCall(async (request) => {
  await assertAdmin(request);
  const adultId = text(request.data?.adultId, 128);
  if (!adultId || adultId.includes("/") || adultId === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Admin semasa tidak boleh dipadam.");
  }

  const adultRef = db.doc(`adults/${adultId}`);
  const adultSnapshot = await adultRef.get();
  if (!adultSnapshot.exists) throw new HttpsError("not-found", "Akaun tidak jumpa.");

  const [classSnapshot, studentSnapshot, codeSnapshot, qrTokenSnapshot] = await Promise.all([
    db.collection("classes").where("ownerId", "==", adultId).get(),
    db.collection("students").where("ownerId", "==", adultId).get(),
    db.collection("classCodes").where("ownerId", "==", adultId).get(),
    db.collection("studentQrTokens").where("ownerId", "==", adultId).get()
  ]);
  for (const student of studentSnapshot.docs) await deleteDocumentTree(student.ref);
  for (const classRecord of classSnapshot.docs) await deleteDocumentTree(classRecord.ref);
  await Promise.all(codeSnapshot.docs.map((code) => code.ref.delete()));
  await Promise.all(qrTokenSnapshot.docs.map((token) => token.ref.delete()));
  await adultRef.delete();
  try {
    await admin.auth().deleteUser(adultId);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw new HttpsError("failed-precondition", error.message || "Akaun Auth tidak dapat dipadam.");
  }
  return { ok: true };
});

exports.createStudentQrCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Log masuk diperlukan.");
  const studentId = text(request.data?.studentId, 128);
  if (!studentId || studentId.includes("/")) throw new HttpsError("invalid-argument", "Murid tidak sah.");
  const studentRef = db.doc(`students/${studentId}`);
  const studentSnapshot = await studentRef.get();
  if (!studentSnapshot.exists || studentSnapshot.data()?.archived) throw new HttpsError("not-found", "Murid tidak jumpa.");
  await assertAdultCanManageStudent(request, studentSnapshot.data() || {});

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashQrToken(token);
  const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_MS).toISOString();
  const previousTokenHash = studentSnapshot.data()?.qrTokenHash;
  if (previousTokenHash && previousTokenHash !== tokenHash) {
    await db.doc(`studentQrTokens/${previousTokenHash}`).set({ active: false, revokedAt: new Date().toISOString() }, { merge: true });
  }
  await db.doc(`studentQrTokens/${tokenHash}`).set({
    studentId,
    ownerId: studentSnapshot.data()?.ownerId || "",
    tokenHash,
    createdBy: request.auth.uid,
    createdAt: new Date().toISOString(),
    expiresAt,
    active: true
  });
  await studentRef.set({ qrTokenHash: tokenHash, qrExpiresAt: expiresAt }, { merge: true });
  return {
    ok: true,
    token,
    expiresAt,
    student: safeStudent(studentId, { ...studentSnapshot.data(), qrExpiresAt: expiresAt })
  };
});

exports.loginStudentWithQr = onCall(async (request) => {
  const token = text(request.data?.token, 200);
  if (!token) throw new HttpsError("invalid-argument", "Kod QR tidak sah.");
  const tokenHash = hashQrToken(token);
  const tokenSnapshot = await db.doc(`studentQrTokens/${tokenHash}`).get();
  const tokenData = tokenSnapshot.data() || {};
  if (!tokenSnapshot.exists || tokenData.active !== true || Date.parse(tokenData.expiresAt || "") <= Date.now()) {
    throw new HttpsError("permission-denied", "Kod QR tidak sah atau telah tamat.");
  }
  const studentSnapshot = await db.doc(`students/${tokenData.studentId}`).get();
  if (!studentSnapshot.exists
    || studentSnapshot.data()?.archived
    || studentSnapshot.data()?.locked
    || studentSnapshot.data()?.qrTokenHash !== tokenHash) {
    throw new HttpsError("permission-denied", "Kod QR tidak sah atau telah tamat.");
  }
  return {
    ok: true,
    studentId: studentSnapshot.id,
    student: safeStudent(studentSnapshot.id, studentSnapshot.data() || {})
  };
});

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

exports.recordStudentAssessment = onCall(async (request) => {
  const studentId = text(request.data?.studentId, 128);
  assertStudentToken(request, studentId);
  await getActiveStudent(studentId);
  const assessment = parseAssessment(request.data || {});
  const resultRef = db.doc(`students/${studentId}/assessmentResults/${assessment.subject}_${assessment.skillId}`);
  await resultRef.set({ ...assessment, studentId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true, skillId: assessment.skillId, passed: assessment.passed };
});
