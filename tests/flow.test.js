import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { transformWithOxc } from "vite";

const root = new URL("../src/", import.meta.url);

function testWindow(path) {
  const storage = new Map();
  const location = new URL(path, "https://app.test");
  return {
    location: { pathname: location.pathname, search: location.search, replace(value) { this.redirect = value; } },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    dispatchEvent() {}
  };
}

async function loadModule(entry, window, mocks, stubComponents = false) {
  const context = vm.createContext({ window, URL, URLSearchParams, console, CustomEvent: class {} });
  const cache = new Map();
  async function moduleFor(id) {
    if (cache.has(id)) return cache.get(id);
    let exports = mocks[id];
    if (!exports && (id.endsWith(".css") || (stubComponents && id.endsWith(".jsx") && id !== entry))) {
      exports = { default: function Activity() {} };
    }
    let module;
    if (exports) {
      module = new vm.SyntheticModule(Object.keys(exports), function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
      }, { context, identifier: id });
    } else {
      let source = await readFile(new URL(id), "utf8");
      if (id.endsWith(".jsx")) source = (await transformWithOxc(source, new URL(id).pathname, { jsx: { runtime: "automatic" } })).code;
      module = new vm.SourceTextModule(source, { context, identifier: id });
    }
    cache.set(id, module);
    return module;
  }
  const module = await moduleFor(entry);
  await module.link((specifier, parent) => moduleFor(specifier.startsWith(".") ? new URL(specifier, parent.identifier).href : specifier));
  await module.evaluate();
  return module.namespace;
}

async function renderRoute(path, { adult = null, student = null } = {}) {
  const window = testWindow(path);
  const jsx = (type, props, key) => ({ type, props, key });
  const app = await loadModule(new URL("App.jsx", root).href, window, {
    react: { useEffect() {}, useState: (value) => [typeof value === "function" ? value() : value, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    [new URL("utils/kembaraStore.js", root).href]: {
      getActiveAdult: () => adult, getActiveStudent: () => student,
      isGuestPathAllowed: () => false, isDemoSessionValid: () => false,
      refreshAppMeta() {}, startDemoSession() {}, startKembaraAuth() {}, whenAuthReady() {}
    },
    [new URL("utils/interfaceAudio.js", root).href]: { isInteractiveTarget() {}, playInterfaceClick() {} },
    "lucide-react": { BookOpen() {}, Calculator() {}, Flag() {}, Footprints() {}, Sparkles() {} }
  }, true);
  const route = app.default().props.children[0];
  return { result: route.type(), window };
}

test("teacher activities retain their parent menu and do not reward student missions", async () => {
  const adult = { id: "teacher" };
  const student = { id: "old-student", track: "math", isGuest: true };
  const paths = ["/addition-regroup", "/minus-regroup", "/zombie-defense", "/mosquito-splat", "/kvk"];
  for (const path of paths) {
    const { result, window } = await renderRoute(`${path}?mode=teacher&returnTo=%2Fcikgu%2Fpanduan&mission=tambah&op=tolak&game=mosquito`, { adult, student });
    assert.equal(window.location.redirect, undefined);
    assert.equal(result.props.backHref, `/cikgu/panduan?subject=${path === "/kvk" ? "bm" : "math"}`);
    assert.equal(result.props.onComplete, undefined);
  }
  const { result, window } = await renderRoute("/murid/bahasa-melayu?mode=teacher&category=perkataan&returnTo=%2Fcikgu%2Fmengajar&mission=huruf", { adult, student });
  assert.equal(result.props.initialCategory, "perkataan");
  assert.equal(result.props.teachingMode, true);
  assert.equal(result.props.onMissionComplete, undefined);
  result.props.onBack();
  assert.equal(window.location.href, "/cikgu/mengajar?subject=bm");
});

test("standalone student activities return to the subject menu", async () => {
  for (const path of ["/addition-regroup", "/minus-regroup", "/zombie-defense", "/mosquito-splat?game=mosquito"]) {
    const { result } = await renderRoute(path, { student: { id: "pupil", track: "both" } });
    assert.equal(result.props.backHref, "/murid/matematik/aktiviti");
  }
  const { result, window } = await renderRoute("/murid/matematik/aktiviti", { student: { id: "pupil", track: "both" } });
  result.props.onBack();
  assert.equal(window.location.href, "/murid/matematik");
});

test("teacher routes require an adult session", async () => {
  const { result, window } = await renderRoute("/murid/bahasa-melayu?mode=teacher&category=perkataan", { student: { id: "pupil", track: "both" } });
  assert.equal(result, null);
  assert.equal(window.location.redirect, "/cikgu");
});

test("adult visits to the student dashboard return to the teaching menu", async () => {
  const { result, window } = await renderRoute("/murid/ruang", { adult: { id: "teacher" } });
  assert.equal(result, null);
  assert.equal(window.location.redirect, "/cikgu/mengajar");
});

test("real logins replace demo sessions", async () => {
  const window = testWindow("/");
  const records = {
    "meta/app": { demo: { active: true, studentToken: "test-student-token", teacherToken: "test-teacher-token" } },
    "adults/teacher": { name: "Teacher", active: true, role: "teacher" },
    "students/pupil": { nickname: "Pupil", lock: ["ayam", "bola"], authUid: "pupil-auth", track: "both" }
  };
  const unexpected = () => { throw new Error("Unexpected Firebase call"); };
  const auth = Object.fromEntries(["createUserWithEmailAndPassword", "onAuthStateChanged", "setPersistence", "signOut", "updateProfile"].map((name) => [name, unexpected]));
  auth.inMemoryPersistence = {};
  auth.GoogleAuthProvider = class {
    setCustomParameters() {}
  };
  auth.signInWithPopup = unexpected;
  auth.signInWithEmailAndPassword = async () => ({ user: { uid: "teacher" } });
  const firestore = Object.fromEntries(["collection", "getDocs", "limit", "query", "runTransaction", "setDoc", "where"].map((name) => [name, unexpected]));
  firestore.doc = (_db, collection, id) => `${collection}/${id}`;
  firestore.getDoc = async (ref) => ({ exists: () => Boolean(records[ref]), data: () => records[ref] });
  firestore.updateDoc = async (ref, values) => Object.assign(records[ref], values);
  const store = await loadModule(new URL("utils/kembaraStore.js", root).href, window, {
    "firebase/auth": auth,
    "firebase/firestore": firestore,
    [new URL("utils/firebase.js", root).href]: { auth: {}, db: {}, secondaryAuth: {} }
  });
  await store.refreshAppMeta();
  assert.equal((await store.startDemoSession("teacher", "test-teacher-token")).ok, true);
  assert.equal(store.getActiveAdult().isDemo, true);
  assert.equal((await store.loginAdult("teacher@test.local", "test-password")).ok, true);
  assert.equal(store.getActiveAdult().id, "teacher");
  assert.equal(store.getKembaraSession().demoRole, null);
  await store.startDemoSession("student", "test-student-token");
  assert.equal(store.getActiveStudent().isDemo, true);
  assert.equal((await store.loginStudentWithPictures("pupil", ["ayam", "bola"])).ok, true);
  assert.equal(store.getActiveStudent().id, "pupil");
  assert.equal(store.getActiveAdult(), null);
  assert.equal(store.getKembaraSession().demoRole, null);
  assert.equal(store.getKembaraSession().demoToken, null);
});
