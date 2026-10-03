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
  const key = `pemulihan-assessments-v1:${studentId}`;
  const record = {
    id: `${subject}_${skillId}`,
    studentId,
    subject,
    skillId,
    score: Number(score) || 0,
    total: Number(total) || 0,
    percentage: total ? Math.round((Number(score) / Number(total)) * 100) : 0,
    passed: Number(score) === Number(total),
    updatedAt: new Date().toISOString()
  };
  try {
    const current = JSON.parse(window.localStorage.getItem(key) || "[]");
    const rows = Array.isArray(current) ? current.filter((item) => item.id !== record.id) : [];
    window.localStorage.setItem(key, JSON.stringify([...rows, record]));
    return { ok: true, localOnly: true, data: record };
  } catch (error) {
    return { ok: false, localOnly: true, error };
  }
}

export async function loadStudentAssessmentResults(studentId) {
  if (!studentId) return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(`pemulihan-assessments-v1:${studentId}`) || "[]");
    return Array.isArray(rows) ? rows : [];
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
