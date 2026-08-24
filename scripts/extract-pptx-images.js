import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { PERKATAAN_SKILLS } from "../src/data/perkataan.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extractRoot = process.env.PPTX_EXTRACT_DIR || path.join(process.env.TEMP || ".", "pptx-extract");
const slidesDir = path.join(extractRoot, "ppt", "slides");
const relsDir = path.join(slidesDir, "_rels");
const mediaDir = path.join(extractRoot, "ppt", "media");
const outputDir = path.join(projectRoot, "public", "images", "perkataan");
const customAssetDir = path.join(projectRoot, "scripts", "assets", "perkataan");

if (!fs.existsSync(slidesDir) || !fs.existsSync(mediaDir)) {
  throw new Error(`Missing extracted PPTX at ${extractRoot}. Expand the PPTX first.`);
}

const words = new Set(PERKATAAN_SKILLS.flatMap((skill) => skill.words || []));
const mediaOverrides = new Map([
  ["api", "image93.png"],
]);
const sourceOverrides = new Map([
  ["beca", path.join(customAssetDir, "beca.jpg")],
  ["ini", path.join(customAssetDir, "ini.png")],
  ["itu", path.join(customAssetDir, "itu.png")],
  ["lelaki", path.join(customAssetDir, "lelaki.png")],
  ["lima", path.join(customAssetDir, "lima.png")],
]);
const framingProfiles = new Map([
  ["baju", { size: 400, offsetY: -12 }],
  ["beca", { size: 480 }],
  ["cili", { size: 400, offsetY: -12 }],
  ["kelapa", { size: 400 }],
  ["kereta", { size: 400 }],
  ["kerusi", { size: 400 }],
  ["kuda", { size: 440 }],
  ["lelaki", { size: 440 }],
  ["lima", { size: 400, offsetY: -12 }],
  ["satu", { size: 400, offsetY: -12 }],
  ["tiga", { size: 400, offsetY: -12 }],
]);
const slideFiles = fs.readdirSync(slidesDir)
  .filter((file) => /^slide\d+\.xml$/.test(file))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function readSlide(slideFile) {
  const xml = fs.readFileSync(path.join(slidesDir, slideFile), "utf8");
  const texts = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)]
    .map((match) => decodeXml(match[1]).trim())
    .filter(Boolean);

  const relsPath = path.join(relsDir, `${slideFile}.rels`);
  const rels = fs.existsSync(relsPath) ? fs.readFileSync(relsPath, "utf8") : "";
  const targets = new Map([...rels.matchAll(
    /<Relationship\b[^>]*?Id="([^"]+)"[^>]*?Target="\.\.\/media\/([^"]+)"[^>]*?\/>/g,
  )].map((match) => [match[1], match[2]]));

  // Keep the transform attached to each picture. The word illustration is
  // normally the largest unique picture in the central content area.
  const pictures = [];
  for (const shape of xml.split(/<p:sp\b/).slice(1)) {
    const embeds = [...shape.matchAll(/r:embed="([^"]+)"/g)].map((match) => match[1]);
    if (!embeds.length) continue;
    const transform = shape.match(/<a:off\s+x="(\d+)"\s+y="(\d+)"\s*\/>[\s\S]*?<a:ext\s+cx="(\d+)"\s+cy="(\d+)"\s*\/>/);
    const geometry = transform
      ? { x: Number(transform[1]), y: Number(transform[2]), cx: Number(transform[3]), cy: Number(transform[4]) }
      : { x: 0, y: 0, cx: 0, cy: 0 };
    for (const relId of embeds) {
      const media = targets.get(relId);
      if (media) pictures.push({ media, ...geometry });
    }
  }

  return { slideFile, texts, pictures };
}

const slides = slideFiles.map(readSlide);
const frequency = new Map();
for (const slide of slides) {
  for (const picture of slide.pictures) frequency.set(picture.media, (frequency.get(picture.media) || 0) + 1);
}

function candidateScore(candidate) {
  const area = candidate.cx * candidate.cy;
  const centerBias = candidate.x > 4500000 && candidate.x < 12500000 && candidate.y > 1000000 && candidate.y < 3500000 ? 1 : 0;
  return area + centerBias * 1e12;
}

function replaceWithRetry(source, destination) {
  let lastError;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      fs.copyFileSync(source, destination);
      return;
    } catch (error) {
      lastError = error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
  throw lastError;
}

function optimizeToPng(source, destination, { framing, removeWhite = false } = {}) {
  const filters = [];
  if (removeWhite) filters.push("colorkey=0xFFFFFF:0.12:0.05");
  filters.push(framing
    ? `scale=${framing.size}:${framing.size}:force_original_aspect_ratio=decrease`
    : "scale=w='min(512,iw)':h='min(512,ih)':force_original_aspect_ratio=decrease");
  if (framing) {
    filters.push(`pad=512:512:(ow-iw)/2:(oh-ih)/2+${framing.offsetY || 0}:color=black@0`);
  }
  filters.push("format=rgba");
  const temporary = `${destination}.tmp.png`;
  fs.rmSync(temporary, { force: true });
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", source, "-vf", filters.join(","), "-frames:v", "1", "-compression_level", "9", temporary],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    fs.rmSync(temporary, { force: true });
    throw new Error(`Could not optimize ${source} as PNG.`);
  }
  replaceWithRetry(temporary, destination);
  fs.rmSync(temporary);
}

fs.mkdirSync(outputDir, { recursive: true });
const mapped = [];
const ambiguous = [];
const missing = [];

for (const slide of slides) {
  const word = slide.texts.join("").toLowerCase();
  if (!words.has(word)) continue;

  const uniquePngs = slide.pictures
    .filter((picture) => picture.media.toLowerCase().endsWith(".png"))
    .filter((picture) => frequency.get(picture.media) === 1)
    .filter((picture, index, all) => all.findIndex((item) => item.media === picture.media) === index);
  const uniqueJpegs = slide.pictures
    .filter((picture) => /\.(jpe?g)$/i.test(picture.media))
    .filter((picture) => frequency.get(picture.media) === 1)
    .filter((picture, index, all) => all.findIndex((item) => item.media === picture.media) === index);
  const uniqueSvgs = slide.pictures
    .filter((picture) => picture.media.toLowerCase().endsWith(".svg"))
    .filter((picture) => frequency.get(picture.media) === 1)
    .filter((picture, index, all) => all.findIndex((item) => item.media === picture.media) === index);

  const candidates = uniquePngs.length ? uniquePngs : uniqueJpegs.length ? uniqueJpegs : uniqueSvgs;
  if (!candidates.length) {
    missing.push(`${word} (slide ${slide.slideFile})`);
    continue;
  }

  const ranked = [...candidates].sort((a, b) => candidateScore(b) - candidateScore(a));
  const selected = ranked.find((candidate) => candidate.media === mediaOverrides.get(word)) || ranked[0];
  if (ranked.length > 1) {
    ambiguous.push(`${word} (slide ${slide.slideFile}): ${ranked.map((item) => item.media).join(", ")} -> ${selected.media}`);
  }

  const source = sourceOverrides.get(word) || path.join(mediaDir, selected.media);
  const extension = path.extname(selected.media).toLowerCase();
  if (sourceOverrides.has(word) || extension === ".png" || extension === ".jpg" || extension === ".jpeg") {
    optimizeToPng(source, path.join(outputDir, `${word}.png`), {
      framing: framingProfiles.get(word),
      removeWhite: word === "beca" || word === "lima",
    });
  } else {
    fs.copyFileSync(source, path.join(outputDir, `${word}.svg`));
  }
  mapped.push({ word, slide: slide.slideFile, media: selected.media });
}

for (const [word, source] of sourceOverrides) {
  if (mapped.some((item) => item.word === word)) continue;
  optimizeToPng(source, path.join(outputDir, `${word}.png`), {
    framing: framingProfiles.get(word),
    removeWhite: word === "beca" || word === "lima",
  });
  mapped.push({ word, slide: "custom", media: path.basename(source) });
}

console.log(`Mapped ${mapped.length} of ${words.size} words to PNG images.`);
if (ambiguous.length) {
  console.log("Ambiguous slides (selected largest central PNG):");
  for (const item of ambiguous) console.log(`  ${item}`);
}
const mappedWords = new Set(mapped.map((item) => item.word));
const unmappedWords = [...words].filter((word) => !mappedWords.has(word));
if (unmappedWords.length) {
  console.log(`Unmapped words (outside the PPTX or without a unique image): ${unmappedWords.join(", ")}`);
}
if (missing.length) {
  console.log("Slides without a unique image:");
  for (const item of missing) console.log(`  ${item}`);
}
console.log(`Output: ${outputDir}`);
