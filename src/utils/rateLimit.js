import { RATE_LIMIT_COPY } from "../data/kembara.js";
import { speakWithBrowser } from "./malaySpeech.js";

const hits = new Map();
const listeners = new Set();
const MINUTE_WINDOW = 60_000;
const MAX_OPS_PER_MINUTE = 20;

export function canRun(key, minMs) {
  const now = Date.now();
  const last = hits.get(key) || 0;
  if (now - last < minMs) return false;
  hits.set(key, now);
  return true;
}

export function canRunCloud(profileKey = "anon") {
  const now = Date.now();
  const stampKey = `cloud-minute:${profileKey}`;
  const stamps = (hits.get(stampKey) || []).filter((time) => now - time < MINUTE_WINDOW);
  if (stamps.length >= MAX_OPS_PER_MINUTE) {
    hits.set(stampKey, stamps);
    return false;
  }
  stamps.push(now);
  hits.set(stampKey, stamps);
  return true;
}

export function tooFrequent(audience = "child") {
  const copy = RATE_LIMIT_COPY[audience] || RATE_LIMIT_COPY.child;
  listeners.forEach((listener) => listener({ audience, ...copy }));
  if (audience === "child" && copy.audio) speakWithBrowser(copy.audio);
}

export function subscribeRateLimit(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function guardedRun(key, minMs, audience, action) {
  if (!canRun(key, minMs)) {
    tooFrequent(audience);
    return false;
  }
  action();
  return true;
}
