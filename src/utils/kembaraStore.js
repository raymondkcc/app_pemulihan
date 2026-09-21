import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { CLASS_CODE_ALPHABET, FREE_STUDENT_LIMIT, GUEST_DEMO_PATHS } from "../data/kembara.js";
import { auth, db, secondaryAuth } from "./firebase.js";

const SESSION_KEY = "kembara-pintar-session-v1";

const emptySession = () => ({ adultId: null, studentId: null, guest: false, classCode: null, demoComplete: false });

const GUEST_STUDENT = {
  id: "guest",
  nickname: "Murid",
  avatarId: "bintang",
  track: "both",
  isGuest: true,
  progress: {},
  demoComplete: false
};

let authReady = false;
let currentUser = null;
let cachedAdult = null;
let cachedStore = { version: 2, adults: [], classes: [], students: [] };
let cachedHasAdmin = false;
const authWaiters = [];
let authStarted = false;

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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

function hashSecret(value) {
  let hash = 5381;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(index);
  }
  return `k1-${(hash >>> 0).toString(16)}-${text.length}`;
}

async function allocateClassCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = randomCode(attempt > 8 ? 8 : 6);
    const snap = await getDocs(query(collection(db, "classes"), where("code", "==", code), limit(1)));
    if (snap.empty) return code;
  }
  return randomCode(8);
}

async function allocateKadCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `KANCIL-${randomCode(attempt > 8 ? 6 : 4, alphabet)}`;
    const snap = await getDocs(query(collection(db, "students"), where("kadCode", "==", code), limit(1)));
    if (snap.empty) return code;
  }
  return `KANCIL-${randomCode(8, alphabet)}`;
}

function adultFromDoc(id, data = {}) {
  return {
    id,
    name: data.name || "",
    email: data.email || "",
    role: data.role || "teacher",
    plan: data.plan || "free",
    studentLimit: data.studentLimit || FREE_STUDENT_LIMIT,
    active: data.active !== false,
    createdAt: data.createdAt || nowIso()
  };
}

function classFromDoc(id, data = {}) {
  return {
    id,
    ownerId: data.ownerId,
    code: data.code,
    name: data.name || "Kelas"
  };
}

function studentFromDoc(id, data = {}) {
  return {
    id,
    ownerId: data.ownerId,
    classId: data.classId,
    nickname: data.nickname || "",
    avatarId: data.avatarId || "bintang",
    track: data.track || "both",
    lock: data.lock || null,
    lockHash: data.lockHash || null,
    hasLock: Boolean(data.hasLock || data.lockHash || data.lock),
    kadCode: data.kadCode,
    failCount: data.failCount || 0,
    locked: Boolean(data.locked),
    progress: data.progress || {},
    archived: Boolean(data.archived),
    createdAt: data.createdAt || nowIso()
  };
}

function authMessage(error) {
  const code = error?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Kata laluan tidak tepat.";
  }
  if (code === "auth/invalid-email") return "E-mel tidak sah.";
  if (code === "auth/email-already-in-use") return "E-mel ini sudah ada.";
  if (code === "auth/weak-password") return "Kata laluan terlalu lemah. Guna sekurang-kurangnya 6 aksara.";
  if (code === "auth/too-many-requests") return "Terlalu banyak cubaan. Cuba lagi nanti.";
  if (code === "auth/network-request-failed") return "Rangkaian gagal. Semak internet.";
  if (code === "permission-denied") return "Firestore menolak akses. Kemas kini rules dahulu.";
  return error?.message || "Tidak berjaya. Cuba lagi.";
}

function notifyAuthWaiters() {
  const waiters = authWaiters.splice(0);
  waiters.forEach((resolve) => resolve(currentUser));
}

export function startKembaraAuth() {
  if (authStarted || typeof window === "undefined") return;
  authStarted = true;
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (!user) {
      cachedAdult = null;
      writeSession({ ...readSession(), adultId: null });
      authReady = true;
      notifyAuthWaiters();
      return;
    }
    try {
      const snap = await getDoc(doc(db, "adults", user.uid));
      if (snap.exists()) {
        const adult = adultFromDoc(user.uid, snap.data());
        if (!adult.active) {
          cachedAdult = null;
          await signOut(auth);
          writeSession({ ...readSession(), adultId: null });
        } else {
          cachedAdult = adult;
          writeSession({ ...readSession(), adultId: user.uid });
        }
      } else if (cachedAdult?.id !== user.uid) {
        cachedAdult = null;
      }
    } catch {
      if (cachedAdult?.id !== user.uid) cachedAdult = null;
    }
    authReady = true;
    notifyAuthWaiters();
  });
}

export function whenAuthReady() {
  startKembaraAuth();
  if (authReady) return Promise.resolve(currentUser);
  return new Promise((resolve) => authWaiters.push(resolve));
}

export function getKembaraStore() {
  return cachedStore;
}

export function getKembaraSession() {
  return readSession();
}

export function hasAdmin() {
  return cachedHasAdmin;
}

export function getActiveAdult() {
  return cachedAdult && cachedAdult.active ? cachedAdult : null;
}

export function getAdultClass(adultId) {
  return cachedStore.classes.find((item) => item.ownerId === adultId) || null;
}

export function listStudentsForAdult(adultId) {
  return cachedStore.students.filter((student) => student.ownerId === adultId && !student.archived);
}

export function studentSeatCount(adultId) {
  return listStudentsForAdult(adultId).length;
}

export function getActiveStudent() {
  const session = readSession();
  if (session.guest) return { ...GUEST_STUDENT, demoComplete: Boolean(session.demoComplete) };
  if (!session.studentId) return null;
  const cached = cachedStore.students.find((student) => student.id === session.studentId && !student.archived);
  if (cached) return cached;
  const stored = session.student;
  if (stored && stored.id === session.studentId && !stored.archived) return stored;
  return null;
}

export async function logoutAdult() {
  writeSession({ ...readSession(), adultId: null });
  cachedAdult = null;
  currentUser = null;
  try {
    await signOut(auth);
  } catch {
    /* already signed out */
  }
}

export function logoutStudent() {
  const session = readSession();
  writeSession({ ...session, studentId: null, guest: false, demoComplete: false, student: null });
}

export function clearClassSession() {
  writeSession({ ...readSession(), classCode: null, studentId: null, guest: false, student: null });
}

export async function refreshAppMeta() {
  try {
    const snap = await getDoc(doc(db, "meta", "app"));
    cachedHasAdmin = Boolean(snap.exists() && snap.data()?.adminExists);
    return cachedHasAdmin;
  } catch {
    return cachedHasAdmin;
  }
}

async function loadOwnedData(adultId) {
  if (!adultId) {
    cachedStore = { version: 2, adults: [], classes: [], students: [] };
    return cachedStore;
  }
  const [classSnap, studentSnap] = await Promise.all([
    getDocs(query(collection(db, "classes"), where("ownerId", "==", adultId))),
    getDocs(query(collection(db, "students"), where("ownerId", "==", adultId)))
  ]);
  cachedStore = {
    version: 2,
    adults: cachedAdult ? [cachedAdult] : [],
    classes: classSnap.docs.map((item) => classFromDoc(item.id, item.data())),
    students: studentSnap.docs.map((item) => studentFromDoc(item.id, item.data()))
  };
  return cachedStore;
}

export async function loadAdultWorkspace() {
  await whenAuthReady();
  const adult = getActiveAdult();
  if (!adult) {
    cachedStore = { version: 2, adults: [], classes: [], students: [] };
    return { adult: null, store: cachedStore };
  }
  await loadOwnedData(adult.id);
  return { adult, store: cachedStore };
}

export async function loadAdminWorkspace() {
  await whenAuthReady();
  const adult = getActiveAdult();
  if (!adult || adult.role !== "admin") {
    return { adult, store: cachedStore, stats: getDailyStats() };
  }
  const [adultsSnap, classesSnap, studentsSnap] = await Promise.all([
    getDocs(collection(db, "adults")),
    getDocs(collection(db, "classes")),
    getDocs(collection(db, "students"))
  ]);
  cachedStore = {
    version: 2,
    adults: adultsSnap.docs.map((item) => adultFromDoc(item.id, item.data())),
    classes: classesSnap.docs.map((item) => classFromDoc(item.id, item.data())),
    students: studentsSnap.docs.map((item) => studentFromDoc(item.id, item.data()))
  };
  return { adult, store: cachedStore, stats: getDailyStats() };
}

async function claimFirstAdmin(user, { name, email }) {
  const adultRef = doc(db, "adults", user.uid);
  const metaRef = doc(db, "meta", "app");
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists() && metaSnap.data()?.adminExists) {
    throw new Error("Admin sudah ada.");
  }
  const adultSnap = await getDoc(adultRef);
  if (adultSnap.exists()) {
    const existing = adultFromDoc(user.uid, adultSnap.data());
    cachedAdult = existing;
    cachedHasAdmin = existing.role === "admin";
    if (existing.role === "admin") {
      await setDoc(metaRef, { adminExists: true, firstAdminId: user.uid, updatedAt: nowIso() }, { merge: true });
    }
    writeSession({ ...readSession(), adultId: user.uid, studentId: null, guest: false });
    return existing;
  }
  const adult = {
    name: name.trim().slice(0, 40) || email,
    email,
    role: "admin",
    plan: "free",
    studentLimit: FREE_STUDENT_LIMIT,
    active: true,
    createdAt: nowIso()
  };
  await setDoc(adultRef, adult);
  await setDoc(metaRef, { adminExists: true, firstAdminId: user.uid, updatedAt: nowIso() }, { merge: true });
  cachedAdult = adultFromDoc(user.uid, adult);
  cachedHasAdmin = true;
  writeSession({ ...readSession(), adultId: user.uid, studentId: null, guest: false });
  return cachedAdult;
}

export async function bootstrapAdmin({ name, email, password }) {
  const normalisedEmail = email.trim().toLowerCase();
  await refreshAppMeta();
  if (cachedHasAdmin) return { ok: false, error: "Admin sudah ada." };

  let createdHere = false;
  try {
    await createUserWithEmailAndPassword(auth, normalisedEmail, password);
    createdHere = true;
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      try {
        await signInWithEmailAndPassword(auth, normalisedEmail, password);
      } catch (signInError) {
        return { ok: false, error: authMessage(signInError) };
      }
    } else {
      return { ok: false, error: authMessage(error) };
    }
  }

  const user = auth.currentUser;
  if (!user) return { ok: false, error: "Tidak berjaya log masuk." };
  if (name.trim()) {
    try {
      await updateProfile(user, { displayName: name.trim().slice(0, 40) });
    } catch {
      /* display name is optional */
    }
  }

  try {
    const adult = await claimFirstAdmin(user, { name, email: normalisedEmail });
    return { ok: true, adult };
  } catch (error) {
    if (createdHere) {
      try {
        await signOut(auth);
      } catch {
        /* ignore */
      }
    }
    return { ok: false, error: authMessage(error) };
  }
}

async function createAuthUser(email, password) {
  await setPersistence(secondaryAuth, inMemoryPersistence);
  const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const uidValue = credential.user.uid;
  await signOut(secondaryAuth);
  return uidValue;
}

export async function createAdult({ name, email, password, role = "teacher", studentLimit = FREE_STUDENT_LIMIT }) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh tambah akaun." };

  const normalisedEmail = email.trim().toLowerCase();
  let newUid;
  try {
    newUid = await createAuthUser(normalisedEmail, password);
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }

  const adult = {
    name: name.trim().slice(0, 40),
    email: normalisedEmail,
    role: role === "parent" ? "parent" : "teacher",
    plan: "free",
    studentLimit,
    active: true,
    createdAt: nowIso()
  };
  const classId = uid("class");
  const classRecord = {
    ownerId: newUid,
    code: await allocateClassCode(),
    name: adult.name
  };

  try {
    await setDoc(doc(db, "adults", newUid), adult);
    await setDoc(doc(db, "classes", classId), classRecord);
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }

  const savedAdult = adultFromDoc(newUid, adult);
  const savedClass = classFromDoc(classId, classRecord);
  cachedStore = {
    ...cachedStore,
    adults: [...cachedStore.adults, savedAdult],
    classes: [...cachedStore.classes, savedClass]
  };
  return { ok: true, adult: savedAdult, classRecord: savedClass };
}

export async function loginAdult(email, password) {
  const normalisedEmail = email.trim().toLowerCase();
  try {
    const credential = await signInWithEmailAndPassword(auth, normalisedEmail, password);
    const user = credential.user;
    const snap = await getDoc(doc(db, "adults", user.uid));
    if (!snap.exists()) {
      await refreshAppMeta();
      if (!cachedHasAdmin) {
        const adult = await claimFirstAdmin(user, {
          name: user.displayName || normalisedEmail.split("@")[0],
          email: normalisedEmail
        });
        return { ok: true, adult };
      }
      await signOut(auth);
      return { ok: false, error: "Akaun Auth wujud, tetapi belum dibuka dalam app. Minta admin buka akaun." };
    }
    const adult = adultFromDoc(user.uid, snap.data());
    if (!adult.active) {
      await signOut(auth);
      return { ok: false, error: "Akaun tidak jumpa atau ditutup." };
    }
    cachedAdult = adult;
    cachedHasAdmin = cachedHasAdmin || adult.role === "admin";
    writeSession({ ...readSession(), adultId: adult.id, studentId: null, guest: false });
    return { ok: true, adult };
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }
}

export async function setAdultLimit(adultId, studentLimit) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh naikkan had." };
  const limit = Math.max(1, Number(studentLimit) || FREE_STUDENT_LIMIT);
  try {
    await updateDoc(doc(db, "adults", adultId), {
      studentLimit: limit,
      plan: limit > FREE_STUDENT_LIMIT ? "plus" : "free"
    });
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }
  cachedStore = {
    ...cachedStore,
    adults: cachedStore.adults.map((adult) => adult.id === adultId
      ? { ...adult, studentLimit: limit, plan: limit > FREE_STUDENT_LIMIT ? "plus" : "free" }
      : adult)
  };
  return { ok: true };
}

export async function setAdultActive(adultId, active) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh ubah akaun." };
  try {
    await updateDoc(doc(db, "adults", adultId), { active: Boolean(active) });
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }
  cachedStore = {
    ...cachedStore,
    adults: cachedStore.adults.map((adult) => adult.id === adultId ? { ...adult, active: Boolean(active) } : adult)
  };
  return { ok: true };
}

export async function makeAdmin(adultId) {
  const actor = getActiveAdult();
  if (!actor || actor.role !== "admin") return { ok: false, error: "Hanya admin boleh tukar peranan." };
  try {
    await updateDoc(doc(db, "adults", adultId), { role: "admin" });
    await setDoc(doc(db, "meta", "app"), { adminExists: true, updatedAt: nowIso() }, { merge: true });
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }
  cachedStore = {
    ...cachedStore,
    adults: cachedStore.adults.map((adult) => adult.id === adultId ? { ...adult, role: "admin" } : adult)
  };
  cachedHasAdmin = true;
  return { ok: true };
}

export async function ensureAdultClass(adultId) {
  const existing = cachedStore.classes.find((item) => item.ownerId === adultId);
  if (existing) return existing;
  const owned = await getDocs(query(collection(db, "classes"), where("ownerId", "==", adultId), limit(1)));
  if (!owned.empty) {
    const item = classFromDoc(owned.docs[0].id, owned.docs[0].data());
    cachedStore = { ...cachedStore, classes: [...cachedStore.classes, item] };
    return item;
  }
  const adult = cachedAdult?.id === adultId
    ? cachedAdult
    : adultFromDoc(adultId, (await getDoc(doc(db, "adults", adultId))).data() || {});
  const classId = uid("class");
  const classRecord = {
    ownerId: adultId,
    code: await allocateClassCode(),
    name: adult?.name || "Kelas"
  };
  await setDoc(doc(db, "classes", classId), classRecord);
  const saved = classFromDoc(classId, classRecord);
  cachedStore = { ...cachedStore, classes: [...cachedStore.classes, saved] };
  return saved;
}

export async function addStudent({ nickname, avatarId, track }) {
  const adult = getActiveAdult();
  if (!adult) return { ok: false, error: "Sila log masuk dahulu." };

  await loadOwnedData(adult.id);
  const count = cachedStore.students.filter((student) => student.ownerId === adult.id && !student.archived).length;
  if (count >= (adult.studentLimit || FREE_STUDENT_LIMIT)) {
    return { ok: false, error: "limit", limit: adult.studentLimit || FREE_STUDENT_LIMIT };
  }

  const classRecord = await ensureAdultClass(adult.id);
  const studentId = uid("student");
  const student = {
    ownerId: adult.id,
    classId: classRecord.id,
    nickname: nickname.trim().slice(0, 18),
    avatarId,
    track: track === "bm" || track === "math" ? track : "both",
    lock: null,
    lockHash: null,
    hasLock: false,
    kadCode: await allocateKadCode(),
    failCount: 0,
    locked: false,
    progress: {},
    archived: false,
    createdAt: nowIso()
  };
  try {
    await setDoc(doc(db, "students", studentId), student);
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }
  const saved = studentFromDoc(studentId, student);
  cachedStore = { ...cachedStore, students: [...cachedStore.students, saved] };
  return { ok: true, student: saved, classRecord };
}

export async function updateStudent(studentId, patch) {
  await updateDoc(doc(db, "students", studentId), patch);
  cachedStore = {
    ...cachedStore,
    students: cachedStore.students.map((student) => student.id === studentId ? { ...student, ...patch } : student)
  };
}

export async function setStudentLock(studentId, pictureIds) {
  if (!Array.isArray(pictureIds) || pictureIds.length !== 2) return { ok: false, error: "Pilih dua gambar." };
  await updateStudent(studentId, {
    lock: null,
    lockHash: hashSecret(pictureIds.join("|")),
    hasLock: true,
    failCount: 0,
    locked: false
  });
  return { ok: true };
}

export async function resetStudentLock(studentId) {
  const adult = getActiveAdult();
  if (!adult) return { ok: false, error: "Sila log masuk dahulu." };
  await updateStudent(studentId, { lock: null, lockHash: null, hasLock: false, failCount: 0, locked: false });
  return { ok: true };
}

export async function archiveStudent(studentId) {
  const adult = getActiveAdult();
  if (!adult) return { ok: false, error: "Sila log masuk dahulu." };
  await updateStudent(studentId, { archived: true });
  return { ok: true };
}

export async function findClassByCode(code) {
  const normalised = String(code || "").trim().toUpperCase();
  if (!normalised) return null;
  const snap = await getDocs(query(collection(db, "classes"), where("code", "==", normalised), limit(1)));
  if (snap.empty) return null;
  return classFromDoc(snap.docs[0].id, snap.docs[0].data());
}

export async function listClassFaces(code) {
  const classRecord = await findClassByCode(code);
  if (!classRecord) return { ok: false, error: "Kod kelas tidak jumpa." };
  const studentsSnap = await getDocs(query(
    collection(db, "students"),
    where("classId", "==", classRecord.id)
  ));
  const students = studentsSnap.docs
    .map((item) => studentFromDoc(item.id, item.data()))
    .filter((student) => !student.archived && student.classId === classRecord.id);
  writeSession({ ...readSession(), classCode: classRecord.code, guest: false, studentId: null, student: null });
  cachedStore = {
    ...cachedStore,
    classes: [...cachedStore.classes.filter((item) => item.id !== classRecord.id), classRecord],
    students: [
      ...cachedStore.students.filter((item) => item.classId !== classRecord.id),
      ...students
    ]
  };
  return {
    ok: true,
    classRecord,
    faces: students.map((student) => ({
      id: student.id,
      nickname: student.nickname,
      avatarId: student.avatarId,
      hasLock: Boolean(student.hasLock),
      locked: Boolean(student.locked)
    }))
  };
}

export async function findStudentByKad(kadCode) {
  const normalised = String(kadCode || "").trim().toUpperCase();
  const snap = await getDocs(query(collection(db, "students"), where("kadCode", "==", normalised), limit(1)));
  if (snap.empty) return null;
  const student = studentFromDoc(snap.docs[0].id, snap.docs[0].data());
  return student.archived ? null : student;
}

export async function loginStudentWithPictures(studentId, pictureIds) {
  const snap = await getDoc(doc(db, "students", studentId));
  if (!snap.exists()) return { ok: false, error: "Murid tidak jumpa." };
  const student = studentFromDoc(studentId, snap.data());
  if (student.archived) return { ok: false, error: "Murid tidak jumpa." };
  if (student.locked) return { ok: false, error: "locked" };
  if (!student.lockHash && !student.lock) return { ok: false, error: "Kunci belum diset." };

  const match = student.lockHash
    ? student.lockHash === hashSecret(pictureIds.join("|"))
    : student.lock[0] === pictureIds[0] && student.lock[1] === pictureIds[1];
  if (!match) {
    const failCount = (student.failCount || 0) + 1;
    const locked = failCount >= 5;
    await updateDoc(doc(db, "students", studentId), { failCount, locked });
    cachedStore = {
      ...cachedStore,
      students: cachedStore.students.map((item) => item.id === studentId ? { ...item, failCount, locked } : item)
    };
    return { ok: false, error: locked ? "locked" : "wrong", remaining: Math.max(0, 5 - failCount) };
  }

  await updateDoc(doc(db, "students", studentId), { failCount: 0, locked: false });
  const unlocked = { ...student, failCount: 0, locked: false };
  cachedStore = {
    ...cachedStore,
    students: cachedStore.students.map((item) => item.id === studentId ? unlocked : item)
  };
  writeSession({ ...readSession(), studentId, guest: false, demoComplete: false, student: unlocked });
  return { ok: true, student: unlocked };
}

export async function loginStudentWithKad(kadCode) {
  const student = await findStudentByKad(kadCode);
  if (!student) return { ok: false, error: "Kad tidak jumpa." };
  if (student.locked) return { ok: false, error: "locked" };
  cachedStore = {
    ...cachedStore,
    students: [...cachedStore.students.filter((item) => item.id !== student.id), student]
  };
  writeSession({ ...readSession(), studentId: student.id, guest: false, classCode: null, student });
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
  const store = cachedStore;
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
