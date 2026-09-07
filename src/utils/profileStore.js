const STORAGE_KEY = "pemulihan-learning-profiles-v1";
const GUEST_KEY = "pemulihan-learning-guest";
const GUEST_COOKIE = "pemulihan_learning_guest";
const GUEST_PROFILE = { id: "guest", nickname: "Murid", avatarId: "bintang", progress: {}, lastActivity: null, isGuest: true };
let guestSessionFallback = false;

function setGuestSession(active) {
  guestSessionFallback = active;
  try {
    if (active) window.sessionStorage.setItem(GUEST_KEY, "1");
    else window.sessionStorage.removeItem(GUEST_KEY);
  } catch { /* session-only fallback */ }
  try { document.cookie = `${GUEST_COOKIE}=${active ? "1" : ""}; Path=/; SameSite=Lax${active ? "" : "; Max-Age=0"}`; } catch { /* in-memory fallback */ }
}

function hasGuestSession() {
  if (guestSessionFallback) return true;
  try {
    if (window.sessionStorage.getItem(GUEST_KEY) === "1") return true;
  } catch { /* check the same-origin fallback */ }
  try { return document.cookie.split("; ").includes(`${GUEST_COOKIE}=1`); } catch { return false; }
}

function readStore() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed?.version === 1 && Array.isArray(parsed.profiles)) return parsed;
  } catch {
    // A private browsing session can reject localStorage; the app remains usable in memory.
  }
  return { version: 1, profiles: [], activeProfileId: null };
}

function writeStore(store) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* local-only fallback */ }
  return store;
}

export function getProfileStore() { return readStore(); }

export function createProfile(nickname, avatarId) {
  const store = readStore();
  const profile = {
    id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nickname: nickname.trim().slice(0, 18),
    avatarId,
    progress: {},
    lastActivity: null
  };
  setGuestSession(false);
  return writeStore({ ...store, profiles: [...store.profiles, profile], activeProfileId: profile.id });
}

export function setActiveProfile(profileId) {
  setGuestSession(false);
  const store = readStore();
  return writeStore({ ...store, activeProfileId: profileId });
}

export function continueAsGuest() {
  setGuestSession(true);
  return GUEST_PROFILE;
}

export function updateProfile(profileId, patch) {
  const store = readStore();
  return writeStore({ ...store, profiles: store.profiles.map((profile) => profile.id === profileId ? { ...profile, ...patch } : profile) });
}

export function getActiveProfile(store = readStore()) {
  if (hasGuestSession()) return GUEST_PROFILE;
  return store.profiles.find((profile) => profile.id === store.activeProfileId) || null;
}
