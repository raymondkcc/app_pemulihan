const STORAGE_KEY = "pemulihan-learning-profiles-v1";

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
  return writeStore({ ...store, profiles: [...store.profiles, profile], activeProfileId: profile.id });
}

export function setActiveProfile(profileId) {
  const store = readStore();
  return writeStore({ ...store, activeProfileId: profileId });
}

export function updateProfile(profileId, patch) {
  const store = readStore();
  return writeStore({ ...store, profiles: store.profiles.map((profile) => profile.id === profileId ? { ...profile, ...patch } : profile) });
}

export function getActiveProfile(store = readStore()) {
  return store.profiles.find((profile) => profile.id === store.activeProfileId) || null;
}
