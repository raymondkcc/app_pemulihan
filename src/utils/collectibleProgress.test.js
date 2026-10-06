import assert from "node:assert/strict";
import test from "node:test";
import { MAP_THEMES } from "../data/mapThemes.js";
import { getCollectiblesForMap } from "../data/collectibles.js";
import { discoverCollectible, getFoundCollectibles, getUnlockedMapCount, missionRewardMap } from "./collectibleProgress.js";

test("replaying a mission rewards the selected unlocked map", () => {
  const values = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  } };
  try {
    const studentId = "regression-student";
    const first = MAP_THEMES[0];
    const second = MAP_THEMES[1];
    assert.equal(getUnlockedMapCount(studentId, 4), 1);
    assert.equal(missionRewardMap(studentId, second.id, 4).id, first.id);
    for (const item of getCollectiblesForMap(first.id)) {
      assert.ok(item.id);
      discoverCollectible(studentId, first.id);
    }
    assert.equal(getUnlockedMapCount(studentId, 4), 2);
    const target = missionRewardMap(studentId, second.id, 4);
    discoverCollectible(studentId, target.id);
    assert.equal(getFoundCollectibles(studentId, second.id).length, 1);
    assert.equal(getFoundCollectibles(studentId, first.id).length, getCollectiblesForMap(first.id).length);
    assert.equal(missionRewardMap(studentId, "unknown-map", 4).id, first.id);
    assert.equal(getUnlockedMapCount(studentId, 1), 1);
    assert.equal(getUnlockedMapCount(studentId, 4, { isGuest: true }), 1);
    assert.equal(getUnlockedMapCount(studentId, 4, { isDemo: true }), MAP_THEMES.length);
    assert.equal(missionRewardMap(studentId, MAP_THEMES.at(-1).id, 4, { isDemo: true }).id, MAP_THEMES.at(-1).id);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
