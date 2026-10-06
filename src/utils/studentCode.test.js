import assert from "node:assert/strict";
import test from "node:test";
import { formatClassCode, formatStudentCode } from "./studentCode.js";

test("new class codes support incremental typing and pupil suffixes", () => {
  assert.equal(formatStudentCode("d"), "D");
  assert.equal(formatStudentCode("dt69"), "DT69");
  assert.equal(formatStudentCode("dt691"), "DT69-1");
  assert.equal(formatStudentCode("dt69-12"), "DT69-12");
});

test("legacy class codes keep their existing spelling and separators", () => {
  assert.equal(formatStudentCode("kancil-1"), "KANCIL-1");
  assert.equal(formatStudentCode("kancil"), "KANCIL");
  assert.equal(formatStudentCode("abc123-2"), "ABC123-2");
  assert.equal(formatStudentCode(" dt69 - 1 "), "DT69-1");
});

test("class entry accepts a student suffix and keeps the teacher class code", () => {
  assert.equal(formatClassCode("tv56"), "TV56");
  assert.equal(formatClassCode("tv56-2"), "TV56");
  assert.equal(formatClassCode(" TV56 - 2 "), "TV56");
  assert.equal(formatClassCode("kancil-1"), "KANCIL");
});
