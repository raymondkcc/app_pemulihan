/**
 * Firebase emulator integration tests for multiplication progress.
 *
 * Prerequisites (not installed by this test): Firebase CLI, Java, and functions dependencies.
 * Commands: npm install --prefix functions; npm run test:firebase
 * The suite uses project id demo-kembara-pintar and local emulator ports 9099, 8080, and 5001.
 * It never deploys. Without the prerequisites, each test is skipped with the exact missing requirement.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FUNCTIONS_ROOT = resolve(ROOT, "functions");
const PROJECT_ID = "demo-kembara-pintar";
const HOST = "127.0.0.1";
const PORTS = { auth: 9099, firestore: 8080, functions: 5001 };
const FIRESTORE_BASE = `http://${HOST}:${PORTS.firestore}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_BASE = `http://${HOST}:${PORTS.auth}/identitytoolkit.googleapis.com/v1`;
const FUNCTION_BASE = `http://${HOST}:${PORTS.functions}/${PROJECT_ID}/us-central1`;

let emulator;
let setup;
let setupError;

function commandExists(command) {
  const lookup = process.platform === "win32" ? "where.exe" : "which";
  return spawnSync(lookup, [command], { stdio: "ignore" }).status === 0;
}

function firebaseCommand() {
  if (process.env.FIREBASE_CLI_BIN) return { command: process.env.FIREBASE_CLI_BIN, args: [] };
  const command = process.platform === "win32" ? "firebase.cmd" : "firebase";
  return commandExists(command) ? { command, args: [] } : null;
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function waitForPort(port, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://${HOST}:${port}/`, { signal: AbortSignal.timeout(1_000) });
      return;
    } catch (error) {
      lastError = error;
      await sleep(250);
    }
  }
  throw new Error(`Timed out waiting for emulator port ${port}: ${lastError?.message || "not listening"}`);
}

async function waitForFunction(name, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${FUNCTION_BASE}/${name}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: {} }),
        signal: AbortSignal.timeout(1_000)
      });
      const body = await response.text();
      if (response.status !== 404 && !body.includes("does not exist")) return;
      lastError = new Error(`Function ${name} is not loaded yet (${response.status}).`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for function ${name}: ${lastError?.message || "not ready"}`);
}

async function startEmulators() {
  const cli = firebaseCommand();
  if (!cli) {
    throw new Error("Firebase CLI not found. Install firebase-tools or set FIREBASE_CLI_BIN before running test:firebase.");
  }
  if (!commandExists(process.platform === "win32" ? "java.exe" : "java")) {
    throw new Error("Java is required by the Firebase Firestore emulator and was not found on PATH.");
  }


  const functionsAdminPackage = resolve(FUNCTIONS_ROOT, "node_modules/firebase-admin/package.json");
  if (!existsSync(functionsAdminPackage)) {
    throw new Error("functions dependencies are not installed. Run npm install in functions before test:firebase.");
  }

  const args = [
    ...cli.args,
    "emulators:start",
    "--only",
    "auth,firestore,functions",
    "--project",
    PROJECT_ID
  ];
  const child = spawn(cli.command, args, {
    cwd: ROOT,
    env: {
      ...process.env,
      CI: "true",
      GCLOUD_PROJECT: PROJECT_ID
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    // Windows exposes Firebase CLI as a .cmd shim; spawn it through the shell.
    shell: process.platform === "win32"
  });
  const output = [];
  const capture = (chunk) => {
    output.push(String(chunk));
    if (output.length > 80) output.shift();
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  const exited = new Promise((_, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      reject(new Error(`Firebase emulators exited before tests started (${code ?? signal}).\n${output.join("")}`));
    });
  });
  emulator = { child, output, exited };

  await Promise.race([
    Promise.all(Object.values(PORTS).map((port) => waitForPort(port))),
    exited
  ]);
  await Promise.all([
    waitForFunction("beginStudentPractice"),
    waitForFunction("recordMultiplicationSession")
  ]);
  await sleep(500);
}

async function stopEmulators() {
  if (!emulator?.child || emulator.child.exitCode !== null) return;
  const child = emulator.child;
  await new Promise((resolvePromise) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise();
    };
    const timer = setTimeout(() => {
      if (process.platform === "win32" && child.exitCode === null) {
        spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      } else if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
      finish();
    }, 5_000);
    child.once("exit", finish);
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      child.kill("SIGINT");
    }
  });
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function authRequest(operation, payload) {
  return jsonRequest(`${AUTH_BASE}/accounts:${operation}?key=emulator-test-key`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

async function createTeacher(email, password) {
  const { response, body } = await authRequest("signUp", {
    email,
    password,
    returnSecureToken: true
  });
  assert.equal(response.ok, true, JSON.stringify(body));
  return { uid: body.localId, idToken: body.idToken };
}

async function exchangeCustomToken(token) {
  const { response, body } = await authRequest("signInWithCustomToken", {
    token,
    returnSecureToken: true
  });
  assert.equal(response.ok, true, JSON.stringify(body));
  return { uid: body.localId, idToken: body.idToken };
}

async function callFunction(name, data, idToken) {
  const headers = idToken ? { Authorization: `Bearer ${idToken}` } : {};
  const { response, body } = await jsonRequest(`${FUNCTION_BASE}/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ data })
  });
  if (body?.error) {
    const error = new Error(body.error.message || `${name} failed`);
    error.code = String(body.error.status || "").toLowerCase().replaceAll("_", "-");
    error.httpStatus = response.status;
    throw error;
  }
  assert.equal(response.ok, true, JSON.stringify(body));
  return body.result;
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: firestoreFields(value) } };
  throw new TypeError(`Unsupported Firestore test value: ${typeof value}`);
}

function firestoreFields(value) {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, firestoreValue(entry)]));
}

function fromFirestoreValue(value = {}) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("mapValue" in value) return fromFirestoreFields(value.mapValue.fields || {});
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  return undefined;
}

function fromFirestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

async function firestoreRequest(method, path, token, data) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return jsonRequest(`${FIRESTORE_BASE}/${path}`, {
    method,
    headers,
    body: data === undefined ? undefined : JSON.stringify({ fields: firestoreFields(data) })
  });
}

async function getFirestoreDoc(path, token) {
  const { response, body } = await firestoreRequest("GET", path, token);
  assert.equal(response.ok, true, JSON.stringify(body));
  return fromFirestoreFields(body.fields || {});
}

async function seedFixture() {
  const requireFromFunctions = createRequire(resolve(FUNCTIONS_ROOT, "package.json"));
  const admin = requireFromFunctions("firebase-admin");
  process.env.FIRESTORE_EMULATOR_HOST = `${HOST}:${PORTS.firestore}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${HOST}:${PORTS.auth}`;
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  const app = admin.apps.find((candidate) => candidate.name === "emulator-test")
    || admin.initializeApp({ projectId: PROJECT_ID }, "emulator-test");
  const db = admin.firestore(app);

  const teacherOwner = await createTeacher("owner@example.test", "password123");
  const teacherOther = await createTeacher("other@example.test", "password123");
  await db.doc(`adults/${teacherOwner.uid}`).set({ active: true, role: "teacher", studentLimit: 20 });
  await db.doc(`adults/${teacherOther.uid}`).set({ active: true, role: "teacher", studentLimit: 20 });
  await db.doc("students/student-a").set({ ownerId: teacherOwner.uid, studentCode: "A123", archived: false, locked: false });
  await db.doc("students/student-b").set({ ownerId: teacherOther.uid, studentCode: "B123", archived: false, locked: false });
  await db.doc("students/student-a/multiplicationFacts/4x4").set({ attempts: 7, correct: 5, wrong: 2, currentStreak: 0, lastResult: "wrong" });
  await db.doc("students/student-a/multiplicationSessions/teacher-readable").set({ studentId: "student-a", mode: "student", questionCount: 15, answered: 1 });

  const begin = await callFunction("beginStudentPractice", {
    studentId: "student-a",
    studentCode: "A123"
  });
  const student = await exchangeCustomToken(begin.token);
  return { db, teacherOwner, teacherOther, student };
}

function sessionPayload({ sessionId, factKey, correct, difficultyEnd = "easy" }) {
  return {
    studentId: "student-a",
    factDeltas: {
      [factKey]: {
        attempts: 1,
        correct: correct ? 1 : 0,
        wrong: correct ? 0 : 1,
        lastResult: correct ? "correct" : "wrong"
      }
    },
    outcomes: [{ factKey, correct }],
    summary: {
      sessionId,
      mode: "student",
      questionCount: 15,
      answered: 1,
      correct: correct ? 1 : 0,
      wrong: correct ? 0 : 1,
      waves: 1,
      difficultyStart: "easy",
      difficultyEnd,
      reason: "complete",
      startedAt: "2026-09-27T00:00:00.000Z",
      endedAt: "2026-09-27T00:01:00.000Z"
    }
  };
}

async function ensureSetup() {
  if (setup) return setup;
  if (setupError) throw setupError;
  try {
    await startEmulators();
    setup = await seedFixture();
    return setup;
  } catch (error) {
    setupError = error;
    await stopEmulators();
    throw error;
  }
}

async function requireSetup(t) {
  try {
    return await ensureSetup();
  } catch (error) {
    t.skip(`Firebase emulator prerequisites unavailable: ${error.message}`);
    return null;
  }
}

test.after(async () => {
  await stopEmulators();
});

test("own-student callable submission succeeds", async (t) => {
  const context = await requireSetup(t);
  if (!context) return;
  const result = await callFunction(
    "recordMultiplicationSession",
    sessionPayload({ sessionId: "own-submit", factKey: "3x4", correct: true }),
    context.student.idToken
  );
  assert.deepEqual(result, { ok: true, duplicate: false, sessionId: "own-submit" });
  const fact = await context.db.doc("students/student-a/multiplicationFacts/3x4").get();
  assert.equal(fact.data().attempts, 1);
  assert.equal(fact.data().correct, 1);
  assert.equal(fact.data().wrong, 0);
});

test("a student token cannot submit progress for another student", async (t) => {
  const context = await requireSetup(t);
  if (!context) return;
  await assert.rejects(
    callFunction(
      "recordMultiplicationSession",
      { ...sessionPayload({ sessionId: "cross-student", factKey: "3x5", correct: true }), studentId: "student-b" },
      context.student.idToken
    ),
    (error) => error.code === "permission-denied"
  );
});

test("teacher can read owned progress but not another teacher's student", async (t) => {
  const context = await requireSetup(t);
  if (!context) return;
  const ownedFact = await firestoreRequest(
    "GET",
    "students/student-a/multiplicationFacts/4x4",
    context.teacherOwner.idToken
  );
  assert.equal(ownedFact.response.status, 200, JSON.stringify(ownedFact.body));

  const crossTeacherRead = await firestoreRequest(
    "GET",
    "students/student-a/multiplicationFacts/4x4",
    context.teacherOther.idToken
  );
  assert.equal(crossTeacherRead.response.status, 403, JSON.stringify(crossTeacherRead.body));
});

test("direct client writes to multiplication progress are denied", async (t) => {
  const context = await requireSetup(t);
  if (!context) return;
  const factWrite = await firestoreRequest(
    "PATCH",
    "students/student-a/multiplicationFacts/4x4",
    context.teacherOwner.idToken,
    { attempts: 999 }
  );
  assert.equal(factWrite.response.status, 403, JSON.stringify(factWrite.body));

  const sessionWrite = await firestoreRequest(
    "PATCH",
    "students/student-a/multiplicationSessions/direct-write",
    context.student.idToken,
    { studentId: "student-a" }
  );
  assert.equal(sessionWrite.response.status, 403, JSON.stringify(sessionWrite.body));
});

test("callable rejects deltas without matching answer outcomes", async (t) => {
  const context = await requireSetup(t);
  if (!context) return;
  const payload = sessionPayload({ sessionId: "missing-outcomes", factKey: "6x6", correct: true });
  await assert.rejects(
    callFunction("recordMultiplicationSession", { ...payload, outcomes: [] }, context.student.idToken),
    (error) => error.code === "invalid-argument"
  );
});

test("callable transaction merges new fact deltas with existing totals", async (t) => {
  const context = await requireSetup(t);
  if (!context) return;
  await context.db.doc("students/student-a/multiplicationFacts/2x3").delete();
  await context.db.doc("students/student-a/multiplicationSessions/merge-one").delete();
  await context.db.doc("students/student-a/multiplicationSessions/merge-two").delete();

  await callFunction(
    "recordMultiplicationSession",
    sessionPayload({ sessionId: "merge-one", factKey: "2x3", correct: true }),
    context.student.idToken
  );
  await callFunction(
    "recordMultiplicationSession",
    sessionPayload({ sessionId: "merge-two", factKey: "2x3", correct: false }),
    context.student.idToken
  );

  const fact = await context.db.doc("students/student-a/multiplicationFacts/2x3").get();
  assert.deepEqual(
    (({ attempts, correct, wrong, currentStreak, lastResult }) => ({ attempts, correct, wrong, currentStreak, lastResult }))(fact.data()),
    { attempts: 2, correct: 1, wrong: 1, currentStreak: 0, lastResult: "wrong" }
  );
});

test("duplicate session submission is idempotent", async (t) => {
  const context = await requireSetup(t);
  if (!context) return;
  await context.db.doc("students/student-a/multiplicationFacts/5x5").delete();
  await context.db.doc("students/student-a/multiplicationSessions/duplicate-session").delete();
  const payload = sessionPayload({ sessionId: "duplicate-session", factKey: "5x5", correct: true });

  const first = await callFunction("recordMultiplicationSession", payload, context.student.idToken);
  const second = await callFunction("recordMultiplicationSession", payload, context.student.idToken);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);

  const fact = await context.db.doc("students/student-a/multiplicationFacts/5x5").get();
  assert.equal(fact.data().attempts, 1);
  const session = await context.db.doc("students/student-a/multiplicationSessions/duplicate-session").get();
  assert.equal(session.exists, true);
});
