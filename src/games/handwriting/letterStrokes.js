const line = (x1, y1, x2, y2, steps = 12) => Array.from({ length: steps + 1 }, (_, i) => ({ x: x1 + ((x2 - x1) * i) / steps, y: y1 + ((y2 - y1) * i) / steps }));
const join = (...parts) => parts.flatMap((part, index) => index ? part.slice(1) : part);
const smooth = (points, steps = 4) => join(...points.slice(1).map((point, index) => line(points[index].x, points[index].y, point.x, point.y, steps)));
const arc = (cx, cy, rx, ry, start, end, steps = 18) => Array.from({ length: steps + 1 }, (_, i) => {
  const angle = start + ((end - start) * i) / steps;
  return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
});
const stroke = (points, options = {}) => ({ points, ...options });
const cap = 18, mid = 42, base = 76, desc = 91;

// Normalised (0-100) centre lines for beginner, single-storey print handwriting.
// The exact same points are used for the visible route and deterministic checker.
export const LETTER_STROKES = {
  A: [stroke(line(50, cap, 28, base)), stroke(line(50, cap, 73, base)), stroke(line(37, 53, 63, 53))],
  B: [stroke(line(28, cap, 28, base)), stroke(join(arc(28, 33, 20, 15, -Math.PI / 2, Math.PI / 2), arc(28, 60, 22, 16, -Math.PI / 2, Math.PI / 2)))],
  C: [stroke(arc(54, 48, 27, 30, -Math.PI * 0.3, -Math.PI * 1.7))],
  D: [stroke(line(28, cap, 28, base)), stroke(arc(28, 47, 28, 29, -Math.PI / 2, Math.PI / 2))],
  E: [stroke(line(30, cap, 30, base)), stroke(line(30, cap, 72, cap)), stroke(line(30, 48, 63, 48)), stroke(line(30, base, 72, base))],
  F: [stroke(line(31, cap, 31, base)), stroke(line(31, cap, 72, cap)), stroke(line(31, 48, 62, 48))],
  G: [stroke(arc(55, 48, 27, 30, -Math.PI * 0.28, -Math.PI * 1.72)), stroke(join(line(78, 48, 55, 48), line(55, 48, 55, 62)))],
  H: [stroke(line(28, cap, 28, base)), stroke(line(72, cap, 72, base)), stroke(line(28, 48, 72, 48))],
  I: [stroke(line(32, cap, 68, cap)), stroke(line(50, cap, 50, base)), stroke(line(32, base, 68, base))],
  J: [stroke(join(line(66, cap, 66, 64), arc(51, 64, 15, 14, 0, Math.PI)))],
  K: [stroke(line(29, cap, 29, base)), stroke(line(29, 49, 72, cap)), stroke(line(29, 49, 73, base))],
  L: [stroke(join(line(30, cap, 30, base), line(30, base, 72, base)))],
  M: [stroke(line(24, cap, 24, base)), stroke(join(line(24, cap, 50, 53), line(50, 53, 76, cap), line(76, cap, 76, base)))],
  N: [stroke(line(27, cap, 27, base)), stroke(line(27, cap, 73, base)), stroke(line(73, cap, 73, base))],
  O: [stroke(arc(50, 47, 26, 30, -Math.PI / 2, Math.PI * 1.5))],
  P: [stroke(line(29, cap, 29, base)), stroke(arc(29, 34, 22, 16, -Math.PI / 2, Math.PI / 2))],
  Q: [stroke(arc(48, 47, 25, 29, -Math.PI / 2, Math.PI * 1.5)), stroke(line(58, 61, 77, base))],
  R: [stroke(line(29, cap, 29, base)), stroke(arc(29, 34, 22, 16, -Math.PI / 2, Math.PI / 2)), stroke(line(48, 49, 74, base))],
  S: [stroke(smooth([
    { x: 72, y: 25 }, { x: 62, y: 18 }, { x: 45, y: 19 }, { x: 33, y: 28 }, { x: 36, y: 42 },
    { x: 50, y: 48 }, { x: 65, y: 53 }, { x: 70, y: 65 }, { x: 61, y: 76 }, { x: 43, y: 78 }, { x: 29, y: 70 }
  ]))],
  T: [stroke(line(25, cap, 75, cap)), stroke(line(50, cap, 50, base))],
  U: [stroke(join(line(28, cap, 28, 61), arc(50, 61, 22, 15, Math.PI, 0), line(72, 61, 72, cap)))],
  V: [stroke(join(line(25, cap, 50, base), line(50, base, 75, cap)))],
  W: [stroke(join(line(22, cap, 35, base), line(35, base, 50, 49), line(50, 49, 65, base), line(65, base, 78, cap)))],
  X: [stroke(line(27, cap, 73, base)), stroke(line(73, cap, 27, base))],
  Y: [stroke(join(line(25, cap, 50, 49), line(50, 49, 75, cap))), stroke(line(50, 49, 50, base))],
  Z: [stroke(join(line(27, cap, 73, cap), line(73, cap, 27, base), line(27, base, 73, base)))],
  a: [stroke(arc(51, 59, 19, 17, 0, Math.PI * 2)), stroke(line(70, mid, 70, base))],
  b: [stroke(line(29, cap, 29, base)), stroke(arc(47, 59, 18, 17, Math.PI, Math.PI * 3))],
  c: [stroke(arc(54, 59, 20, 17, -Math.PI * 0.28, -Math.PI * 1.72))],
  d: [stroke(arc(52, 59, 18, 17, 0, Math.PI * 2)), stroke(line(70, cap, 70, base))],
  e: [stroke(join(line(35, 59, 68, 59), arc(53, 59, 18, 17, 0, Math.PI * 1.75)))],
  f: [stroke(join(arc(57, 32, 14, 15, Math.PI * 1.1, Math.PI * 2.1), line(70.3, 36.6, 48, base, 12))), stroke(line(35, 48, 65, 48))],
  g: [stroke(arc(50, 59, 19, 17, -Math.PI / 2, Math.PI * 1.5)), stroke(join(line(69, 43, 69, 83), arc(52, 83, 17, 14, 0, Math.PI)))],
  h: [stroke(line(29, cap, 29, base)), stroke(smooth([{ x: 29, y: 60 }, { x: 35, y: 49 }, { x: 45, y: 42 }, { x: 57, y: 43 }, { x: 66, y: 51 }, { x: 69, y: 61 }, { x: 69, y: base }]))],
  i: [stroke(line(50, mid, 50, base)), stroke([{ x: 50, y: 27 }, { x: 51, y: 28 }], { dot: true })],
  j: [stroke(join(line(58, mid, 58, 82), arc(47, 82, 11, 10, 0, Math.PI))), stroke([{ x: 58, y: 27 }, { x: 59, y: 28 }], { dot: true })],
  k: [stroke(line(29, cap, 29, base)), stroke(line(70, mid, 29, 60)), stroke(line(43, 58, 72, base))],
  l: [stroke(line(50, cap, 50, base))],
  m: [stroke(join(
    line(27, base, 27, mid, 8), line(27, mid, 27, 59, 4), line(27, 59, 31, 48, 4),
    line(31, 48, 41, 42, 4), line(41, 42, 51, 46, 4), line(51, 46, 58, 57, 4),
    line(58, 57, 58, base, 5), line(58, base, 58, 58, 5), line(58, 58, 62, 48, 4),
    line(62, 48, 72, 42, 4), line(72, 42, 82, 46, 4), line(82, 46, 89, 57, 4),
    line(89, 57, 89, base, 5)
  ))],
  n: [stroke(join(
    line(31, base, 31, mid, 8), line(31, mid, 31, 59, 4), line(31, 59, 36, 48, 4),
    line(36, 48, 48, 42, 4), line(48, 42, 60, 46, 4), line(60, 46, 69, 57, 4),
    line(69, 57, 69, base, 5)
  ))],
  o: [stroke(arc(50, 59, 19, 17, -Math.PI / 2, Math.PI * 1.5))],
  p: [stroke(line(29, mid, 29, desc)), stroke(arc(47, 59, 18, 17, -Math.PI / 2, Math.PI * 1.5))],
  q: [stroke(arc(51, 59, 19, 17, -Math.PI / 2, Math.PI * 1.5)), stroke(line(70, mid, 70, desc))],
  r: [stroke(join(line(32, base, 32, mid), line(32, mid, 48, 42, 5), arc(48, 56, 17, 14, -Math.PI / 2, -0.1)))],
  s: [stroke(smooth([{ x: 67, y: 48 }, { x: 59, y: 42 }, { x: 45, y: 43 }, { x: 36, y: 50 }, { x: 48, y: 59 }, { x: 63, y: 63 }, { x: 67, y: 70 }, { x: 58, y: 77 }, { x: 43, y: 76 }, { x: 34, y: 70 }]))],
  t: [stroke(line(50, 27, 50, base)), stroke(line(34, 47, 65, 47))],
  u: [stroke(join(line(31, mid, 31, 62), arc(50, 62, 19, 14, Math.PI, 0), line(69, 62, 69, mid))), stroke(line(69, mid, 69, base))],
  v: [stroke(join(line(30, mid, 50, base), line(50, base, 70, mid)))],
  w: [stroke(join(line(23, mid, 35, base), line(35, base, 50, 60), line(50, 60, 65, base), line(65, base, 78, mid)))],
  x: [stroke(line(32, mid, 68, base)), stroke(line(68, mid, 32, base))],
  y: [stroke(join(line(30, mid, 50, base), line(50, base, 70, mid))), stroke(join(line(70, mid, 58, 84), arc(47, 84, 11, 10, 0, Math.PI)))],
  z: [stroke(join(line(33, mid, 69, mid), line(69, mid, 33, base), line(33, base, 69, base)))]
};

export function getLetterStrokes(letter, letterCase) {
  const glyph = letterCase === "small" ? letter.toLowerCase() : letter.toUpperCase();
  return LETTER_STROKES[glyph] || LETTER_STROKES.A;
}
