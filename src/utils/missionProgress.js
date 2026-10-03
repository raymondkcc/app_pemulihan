const STORAGE_KEY = "kembara-pintar-mission-progress-v1";
const MISSION_EVENT = "kembara:mission-progress";

function readStore() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Progress remains available for the current view when storage is blocked.
  }
}

export function getMissionProgress(studentId) {
  if (!studentId) return { completedIds: [] };
  const record = readStore()[studentId];
  return { completedIds: Array.isArray(record?.completedIds) ? record.completedIds : [] };
}

export function isMissionUnlocked(missionIndex, missions = [], completedIds = []) {
  if (missionIndex <= 0) return true;
  return completedIds.includes(missions[missionIndex - 1]?.id);
}

export function completeMission(studentId, missionId) {
  if (!studentId || !missionId) return getMissionProgress(studentId);
  const store = readStore();
  const current = getMissionProgress(studentId);
  if (current.completedIds.includes(missionId)) return current;
  const next = { completedIds: [...current.completedIds, missionId], updatedAt: new Date().toISOString() };
  store[studentId] = next;
  writeStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MISSION_EVENT, { detail: { studentId, missionId } }));
  }
  return next;
}

export function subscribeToMissionProgress(listener) {
  if (typeof window === "undefined") return () => {};
  const handleProgress = (event) => listener(event.detail);
  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) listener(null);
  };
  window.addEventListener(MISSION_EVENT, handleProgress);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(MISSION_EVENT, handleProgress);
    window.removeEventListener("storage", handleStorage);
  };
}

export { STORAGE_KEY };
