import { CLASS_CODE_ALPHABET, FREE_STUDENT_LIMIT, GUEST_DEMO_PATHS } from "../data/kembara.js";

const STORAGE_KEY = "kembara-pintar-v1";
const SESSION_KEY = "kembara-pintar-session-v1";

const emptyStore = () => ({ version: 1, adults: [], classes: [], students: [] });
const emptySession = () => ({ adultId: null, studentId: null, guest: false, classCode: null });

const GUEST_STUDENT = {
  id: "guest",
  nickname: "Murid",
  avatarId: "bintang",
  track: "both",
  isGuest: true,
  progress: {},
  demoComplete: false
};

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function hashSecret(value) {
  let hash = 5381;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(index);
  }
  return `k1-${(hash >>> 0).toString(16)}-${text.length}`;
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    return parsed || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private browsing can reject localStorage */
  }
  return value;
}

function readStore() {
  const parsed = readJson(STORAGE_KEY, null);
  if (parsed?.version === 1 && Array.isArray(parsed.adults)) return parsed;
  return emptyStore();
}

function writeStore(store) {
  return writeJson(STORAGE_KEY, store);
}

function readSession() {
  const parsed = readJson(SESSION_KEY, null);
  if (parsed && typeof parsed === "object") return { ...emptySession(), ...parsed };
  return emptySession();
}

function writeSession(session) {
  return writeJson(SESSION_KEY, session);
}

function randomCode(length, alphabet = CLASS_CODE_ALPHABET) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function uniqueClassCode(store) {
  let code = randomCode(6);
  while (store.classes.some((item) => item.code === code)) code = randomCode(6);
  return code;
}

function uniqueKadCode(store) {
  let code = `KANCIL-${randomCode(4, "23456789ABCDEFGHJKLMNPQRSTUVWXYZ")}`;
  while (store.students.some((item) => item.kadCode === code)) {
    code = `KANCIL-${randomCode(4, "23456789ABCDEFGHJKLMNPQRSTUVWXYZ")}`;
  }
  return code;
}

export function getKembaraStore() {
  return readStore();
}

export function getKembaraSession() {
  return readSession();
}

export function hasAdmin() {
  return readStore().adults.some((adult) => adult.role === "admin" && adult.active);
}

export function getActiveAdult() {
  const session = readSession();
  if (!session.adultId) return null;
  return readStore().adults.find((adult) => adult.id === session.adultId && adult.active) || null;
}

export function getAdultClass(adultId) {
  return readStore().classes.find((item) => item.ownerId === adultId) || null;
}

export function listStudentsForAdult(adultId) {
  return readStore().students.filter((student) => student.ownerId === adultId && !student.archived);
}

export function studentSeatCount(adultId) {
  return readStore().students.filter((student) => student.ownerId === adultId && !student.archived).length;
}

export function getActiveStudent() {
  const session = readSession();
  if (session.guest) return { ...GUEST_STUDENT, demoComplete: Boolean(session.demoComplete) };
  if (!session.studentId) return null;
  return readStore().students.find((student) => student.id === session.studentId && !student.archived) || null;
}

export function logoutAdult() {
  const session = readSession();
  writeSession({ ...session, adultId: null });
}

export function logoutStudent() {
  writeSession({ ...readSession(), studentId: null, guest: false, demoComplete: false });
}

export function clearClassSession() {
  writeSession({ ...readSession(), classCode: null, studentId: null, guest: false });
}

export function bootstrapAdmin({ name, email, password }) {
  const store = readStore();
  if (store.adults.some((adult) => adult.role === "admin")) {
    return { ok: false, error: "Admin sudah ada." };
  }
  const adult = {
    id: uid("adult"),
    name: name.trim().slice(0, 40),
    email: email.trim().toLowerCase(),
    passwordHash: hashSecret(`${email.trim().toLowerCase()}|${password}`),
    role: "admin",
    plan: "free",
    studentLimit: FREE_STUDENT_LIMIT,
    active: true,
    createdAt: nowIso()
  };
  writeStore({ ...store, adults: [adult] });
  writeSession({ ...readSession(), adultId: adult.id });
  return { ok: true, adult };
}

export function createAdult({ name, email, password, role = "teacher", studentLimit = FREE_STUDENT_LIMIT }) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh tambah akaun." };

  const store = readStore();
  const normalisedEmail = email.trim().toLowerCase();
  if (store.adults.some((adult) => adult.email === normalisedEmail)) {
    return { ok: false, error: "E-mel ini sudah ada." };
  }

  const adult = {
    id: uid("adult"),
    name: name.trim().slice(0, 40),
    email: normalisedEmail,
    passwordHash: hashSecret(`${normalisedEmail}|${password}`),
    role: role === "parent" ? "parent" : "teacher",
    plan: "free",
    studentLimit,
    active: true,
    createdAt: nowIso()
  };
  const classRecord = {
    id: uid("class"),
    ownerId: adult.id,
    code: uniqueClassCode(store),
    name: adult.name
  };
  writeStore({
    ...store,
    adults: [...store.adults, adult],
    classes: [...store.classes, classRecord]
  });
  return { ok: true, adult, classRecord };
}

export function loginAdult(email, password) {
  const store = readStore();
  const normalisedEmail = email.trim().toLowerCase();
  const adult = store.adults.find((item) => item.email === normalisedEmail);
  if (!adult || !adult.active) return { ok: false, error: "Akaun tidak jumpa atau ditutup." };
  if (adult.passwordHash !== hashSecret(`${normalisedEmail}|${password}`)) {
    return { ok: false, error: "Kata laluan tidak tepat." };
  }
  writeSession({ ...readSession(), adultId: adult.id, studentId: null, guest: false });
  return { ok: true, adult };
}

export function setAdultLimit(adultId, studentLimit) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh naikkan had." };
  const limit = Math.max(1, Number(studentLimit) || FREE_STUDENT_LIMIT);
  const store = readStore();
  writeStore({
    ...store,
    adults: store.adults.map((adult) => adult.id === adultId ? { ...adult, studentLimit: limit, plan: limit > FREE_STUDENT_LIMIT ? "plus" : "free" } : adult)
  });
  return { ok: true };
}

export function setAdultActive(adultId, active) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh ubah akaun." };
  const store = readStore();
  writeStore({
    ...store,
    adults: store.adults.map((adult) => adult.id === adultId ? { ...adult, active: Boolean(active) } : adult)
  });
  return { ok: true };
}

export function makeAdmin(adultId) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh tukar peranan." };
  const store = readStore();
  writeStore({
    ...store,
    adults: store.adults.map((adult) => adult.id === adultId ? { ...adult, role: "admin" } : adult)
  });
  return { ok: true };
}

export function ensureAdultClass(adultId) {
  const store = readStore();
  const existing = store.classes.find((item) => item.ownerId === adultId);
  if (existing) return existing;
  const adult = store.adults.find((item) => item.id === adultId);
  const classRecord = {
    id: uid("class"),
    ownerId: adultId,
    code: uniqueClassCode(store),
    name: adult?.name || "Kelas"
  };
  writeStore({ ...store, classes: [...store.classes, classRecord] });
  return classRecord;
}

export function addStudent({ nickname, avatarId, track }) {
  const adult = getActiveAdult();
  if (!adult) return { ok: false, error: "Sila log masuk dahulu." };

  const store = readStore();
  const count = store.students.filter((student) => student.ownerId === adult.id && !student.archived).length;
  if (count >= (adult.studentLimit || FREE_STUDENT_LIMIT)) {
    return { ok: false, error: "limit", limit: adult.studentLimit || FREE_STUDENT_LIMIT };
  }

  const classRecord = ensureAdultClass(adult.id);
  const student = {
    id: uid("student"),
    ownerId: adult.id,
    classId: classRecord.id,
    nickname: nickname.trim().slice(0, 18),
    avatarId,
    track: track === "bm" || track === "math" ? track : "both",
    lock: null,
    kadCode: uniqueKadCode(store),
    failCount: 0,
    locked: false,
    progress: {},
    archived: false,
    createdAt: nowIso()
  };
  writeStore({ ...store, students: [...store.students, student] });
  return { ok: true, student, classRecord };
}

export function updateStudent(studentId, patch) {
  const store = readStore();
  writeStore({
    ...store,
    students: store.students.map((student) => student.id === studentId ? { ...student, ...patch } : student)
  });
}

export function setStudentLock(studentId, pictureIds) {
  if (!Array.isArray(pictureIds) || pictureIds.length !== 2) return { ok: false, error: "Pilih dua gambar." };
  updateStudent(studentId, { lock: pictureIds, failCount: 0, locked: false });
  return { ok: true };
}

export function resetStudentLock(studentId) {
  const adult = getActiveAdult();
  if (!adult) return { ok: false, error: "Sila log masuk dahulu." };
  updateStudent(studentId, { lock: null, failCount: 0, locked: false });
  return { ok: true };
}

export function archiveStudent(studentId) {
  const adult = getActiveAdult();
  if (!adult) return { ok: false, error: "Sila log masuk dahulu." };
  updateStudent(studentId, { archived: true });
  return { ok: true };
}

export function findClassByCode(code) {
  const normalised = String(code || "").trim().toUpperCase();
  if (!normalised) return null;
  return readStore().classes.find((item) => item.code === normalised) || null;
}

export function listClassFaces(code) {
  const classRecord = findClassByCode(code);
  if (!classRecord) return { ok: false, error: "Kod kelas tidak jumpa." };
  const students = readStore().students.filter((student) => student.classId === classRecord.id && !student.archived);
  writeSession({ ...readSession(), classCode: classRecord.code, guest: false, studentId: null });
  return {
    ok: true,
    classRecord,
    faces: students.map((student) => ({
      id: student.id,
      nickname: student.nickname,
      avatarId: student.avatarId,
      hasLock: Boolean(student.lock),
      locked: Boolean(student.locked)
    }))
  };
}

export function findStudentByKad(kadCode) {
  const normalised = String(kadCode || "").trim().toUpperCase();
  return readStore().students.find((student) => student.kadCode === normalised && !student.archived) || null;
}

export function loginStudentWithPictures(studentId, pictureIds) {
  const store = readStore();
  const student = store.students.find((item) => item.id === studentId && !item.archived);
  if (!student) return { ok: false, error: "Murid tidak jumpa." };
  if (student.locked) return { ok: false, error: "locked" };
  if (!student.lock) return { ok: false, error: "Kunci belum diset." };

  const match = student.lock[0] === pictureIds[0] && student.lock[1] === pictureIds[1];
  if (!match) {
    const failCount = (student.failCount || 0) + 1;
    const locked = failCount >= 5;
    writeStore({
      ...store,
      students: store.students.map((item) => item.id === studentId ? { ...item, failCount, locked } : item)
    });
    return { ok: false, error: locked ? "locked" : "wrong", remaining: Math.max(0, 5 - failCount) };
  }

  writeStore({
    ...store,
    students: store.students.map((item) => item.id === studentId ? { ...item, failCount: 0, locked: false } : item)
  });
  writeSession({ ...readSession(), studentId, guest: false, demoComplete: false });
  return { ok: true, student };
}

export function loginStudentWithKad(kadCode) {
  const student = findStudentByKad(kadCode);
  if (!student) return { ok: false, error: "Kad tidak jumpa." };
  if (student.locked) return { ok: false, error: "locked" };
  writeSession({ ...readSession(), studentId: student.id, guest: false, classCode: null });
  return { ok: true, student };
}

export function continueAsGuest() {
  writeSession({ ...emptySession(), guest: true, demoComplete: false });
  return GUEST_STUDENT;
}

export function markGuestDemoComplete() {
  writeSession({ ...readSession(), demoComplete: true });
}

export function isGuestPathAllowed(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return GUEST_DEMO_PATHS.includes(path);
}

export function getDailyStats() {
  const store = readStore();
  return {
    adults: store.adults.length,
    activeAdults: store.adults.filter((adult) => adult.active).length,
    students: store.students.filter((student) => !student.archived).length,
    classes: store.classes.length,
    tracks: {
      bm: store.students.filter((student) => !student.archived && student.track === "bm").length,
      math: store.students.filter((student) => !student.archived && student.track === "math").length,
      both: store.students.filter((student) => !student.archived && student.track === "both").length
    }
  };
}
