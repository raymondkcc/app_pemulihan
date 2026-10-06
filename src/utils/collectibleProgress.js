import { getCollectiblesForMap } from "../data/collectibles.js";
import { MAP_THEMES } from "../data/mapThemes.js";

const STORAGE_KEY = "kembara-pintar-collectibles-v1";
const PENDING_KEY = "kembara-pintar-pending-collectible-v1";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "null");
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The reward can still be shown during the current page visit.
  }
  return value;
}

export function discoverCollectible(studentId, mapId) {
  const items = getCollectiblesForMap(mapId);
  if (!studentId || !items.length) return null;
  const store = readJson(STORAGE_KEY, {});
  const student = store[studentId] || {};
  const foundIds = Array.isArray(student[mapId]) ? student[mapId] : [];
  const item = items.find((candidate) => !foundIds.includes(candidate.id));
  if (!item) return null;
  const nextFoundIds = [...foundIds, item.id];
  writeJson(STORAGE_KEY, { ...store, [studentId]: { ...student, [mapId]: nextFoundIds } });
  writeJson(PENDING_KEY, { studentId, mapId, item, foundCount: nextFoundIds.length, total: items.length });
  return item;
}

export function readPendingCollectible(studentId) {
  const pending = readJson(PENDING_KEY, null);
  return pending?.studentId === studentId ? pending : null;
}

export function clearPendingCollectible(studentId) {
  const pending = readJson(PENDING_KEY, null);
  if (pending?.studentId === studentId) {
    try { window.localStorage.removeItem(PENDING_KEY); } catch { /* optional storage */ }
  }
}

export function getFoundCollectibles(studentId, mapId) {
  const store = readJson(STORAGE_KEY, {});
  const foundIds = store[studentId]?.[mapId];
  return Array.isArray(foundIds) ? foundIds : [];
}

export function hasCollectedMap(studentId, mapId) {
  const items = getCollectiblesForMap(mapId);
  if (!items.length) return false;
  const foundIds = getFoundCollectibles(studentId, mapId);
  return items.every((item) => foundIds.includes(item.id));
}

export function getUnlockedMapCount(studentId, availableCount, { isDemo = false, isGuest = false } = {}) {
  if (isDemo) return MAP_THEMES.length;
  if (isGuest) return 1;
  let count = 1;
  while (count < availableCount && hasCollectedMap(studentId, MAP_THEMES[count - 1].id)) count += 1;
  return count;
}

export function missionRewardMap(studentId, requestedMapId, availableCount, options = {}) {
  const index = MAP_THEMES.findIndex((theme) => theme.id === requestedMapId);
  const count = getUnlockedMapCount(studentId, availableCount, options);
  return MAP_THEMES[index >= 0 && index < count ? index : 0];
}

export { STORAGE_KEY as COLLECTIBLES_STORAGE_KEY, PENDING_KEY as PENDING_COLLECTIBLE_KEY };
