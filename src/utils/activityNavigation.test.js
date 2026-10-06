import assert from "node:assert/strict";
import test from "node:test";
import { activityHref, teacherReturnPath } from "./activityNavigation.js";

test("teacher links retain activity parameters and their return destination", () => {
  const href = activityHref("/murid/bahasa-melayu?category=perkataan&activity=ujian#cards", {
    teacherMode: true,
    returnTo: "/cikgu/mengajar"
  });
  const url = new URL(href, "https://test.local");
  assert.equal(url.pathname, "/murid/bahasa-melayu");
  assert.equal(url.searchParams.get("category"), "perkataan");
  assert.equal(url.searchParams.get("activity"), "ujian");
  assert.equal(url.searchParams.get("mode"), "teacher");
  assert.equal(url.searchParams.get("returnTo"), "/cikgu/mengajar");
  assert.equal(url.hash, "#cards");
});

test("teacher Back returns to the same menu and subject", () => {
  for (const path of ["/cikgu/mengajar", "/cikgu/panduan", "/cikgu/bahasa-melayu", "/cikgu/matematik"]) {
    const params = new URLSearchParams({ returnTo: path });
    const expected = path === "/cikgu/bahasa-melayu" ? "bm" : "math";
    assert.equal(teacherReturnPath(params, "math"), `${path}?subject=${expected}`);
  }
});

test("invalid teacher destinations fall back to the teaching menu", () => {
  for (const path of ["/murid/ruang", "https://external.test", "/cikgu/mengajar?subject=math", ""]) {
    assert.equal(teacherReturnPath(new URLSearchParams({ returnTo: path }), "math"), "/cikgu/mengajar?subject=math");
  }
});

test("student links do not gain teacher mode", () => {
  assert.equal(activityHref("/zombie-defense?op=tolak&assessment=1"), "/zombie-defense?op=tolak&assessment=1");
});
