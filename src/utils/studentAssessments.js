import { collection, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, secondaryApp } from "./firebase.js";

export const ASSESSMENT_SKILLS = {
  bm: [
    { id: "huruf", label: "Huruf" },
    { id: "vokal", label: "Vokal" },
    { id: "suku-kata-kv", label: "Suku Kata KV" },
    { id: "suku-kata-kvk", label: "Suku Kata KVK" },
    { id: "perkataan", label: "Perkataan" }
  ],
  math: [
    { id: "tambah", label: "Tambah" },
    { id: "tolak", label: "Tolak" },
    { id: "darab", label: "Darab" },
    { id: "bahagi", label: "Bahagi" }
  ]
};

export async function persistStudentAssessment({ studentId, subject, skillId, score, total }) {
  if (!studentId || studentId === "guest") return { ok: false, localOnly: true };
  try {
    const record = httpsCallable(getFunctions(secondaryApp), "recordStudentAssessment", { timeout: 4500 });
    const response = await record({ studentId, subject, skillId, score, total });
    return { ok: true, data: response.data || {} };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function loadStudentAssessmentResults(studentId) {
  if (!studentId) return [];
  try {
    const snapshot = await getDocs(collection(db, "students", studentId, "assessmentResults"));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch {
    return [];
  }
}

export function getAssessmentSummary(subject, rows = []) {
  const skills = ASSESSMENT_SKILLS[subject] || [];
  const bySkill = new Map(rows.filter((row) => row.subject === subject).map((row) => [row.skillId, row]));
  const results = skills.map((skill) => ({ ...skill, result: bySkill.get(skill.id) || null }));
  return {
    results,
    passed: results.filter((item) => item.result?.passed === true).length,
    total: results.length
  };
}
