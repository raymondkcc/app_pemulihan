const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function projectToSegment(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  const raw = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared;
  const t = clamp(raw);
  return { point: { x: a.x + dx * t, y: a.y + dy * t }, t };
}

export function nearestOnStroke(point, expected) {
  let best = { distance: Infinity, progress: 0 };
  let travelled = 0;
  const lengths = expected.points.slice(1).map((p, i) => distance(expected.points[i], p));
  const total = lengths.reduce((sum, value) => sum + value, 0) || 1;
  lengths.forEach((segmentLength, index) => {
    const hit = projectToSegment(point, expected.points[index], expected.points[index + 1]);
    const currentDistance = distance(point, hit.point);
    if (currentDistance < best.distance) best = { distance: currentDistance, progress: (travelled + segmentLength * hit.t) / total };
    travelled += segmentLength;
  });
  return best;
}

export function gradeStroke(actual, expected) {
  if (!actual?.length) return { pass: false, score: 0, feedback: "Cuba sentuh titik hijau." };
  const start = expected.points[0], end = expected.points.at(-1);
  if (expected.dot) {
    const centre = actual.reduce((sum, point) => ({ x: sum.x + point.x / actual.length, y: sum.y + point.y / actual.length }), { x: 0, y: 0 });
    const spread = Math.max(...actual.map((point) => distance(point, centre)));
    const close = distance(centre, start) <= 11;
    if (!close) return { pass: false, score: 0, feedback: "Letak titik pada bulatan hijau." };
    if (spread > 12) return { pass: false, score: 45, feedback: "Sentuh ringkas untuk membuat titik." };
    return { pass: true, score: Math.round(100 * clamp(1 - distance(centre, start) / 18)), feedback: "Titik cantik!" };
  }
  if (actual.length < 3) return { pass: false, score: 0, feedback: "Buat garisan yang lebih panjang." };
  const startDistance = distance(actual[0], start);
  if (startDistance > 16) return { pass: false, score: 0, feedback: "Mula di titik hijau." };
  const hits = actual.map((point) => nearestOnStroke(point, expected));
  const within = hits.filter((hit) => hit.distance <= 13).length / hits.length;
  // Permit small hand wobble, but reject a sustained backwards trace. This
  // matters for closed loops where the start and finish occupy the same area.
  const ordered = hits.slice(1).filter((hit, index) => hit.progress >= hits[index].progress - 0.03).length / Math.max(1, hits.length - 1);
  const coverage = Math.max(...hits.map((hit) => hit.progress)) - Math.min(...hits.map((hit) => hit.progress));
  const finish = distance(actual.at(-1), end) <= 17;
  const startScore = clamp(1 - startDistance / 16);
  const score = Math.round(100 * (startScore * 0.2 + within * 0.3 + ordered * 0.2 + coverage * 0.16 + (finish ? 1 : 0) * 0.14));
  if (within < 0.6) return { pass: false, score, feedback: "Ikut laluan berwarna dengan lebih dekat." };
  if (ordered < 0.72) return { pass: false, score, feedback: "Ikut anak panah dari awal hingga akhir." };
  if (coverage < 0.68 || !finish) return { pass: false, score, feedback: "Teruskan hingga bulatan akhir." };
  return { pass: score >= 62, score, feedback: score >= 85 ? "Hebat, laluan kemas!" : "Bagus, teruskan!" };
}

export function gradeLetter(results) {
  const average = Math.round(results.reduce((sum, result) => sum + result.score, 0) / Math.max(1, results.length));
  return { score: average, stars: average >= 88 ? 3 : average >= 72 ? 2 : 1 };
}
