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

if (!fs.existsSync(slidesDir) || !fs.existsSync(mediaDir)) {
  throw new Error(`Missing extracted PPTX at ${extractRoot}. Expand the PPTX first.`);
}

const words = new Set(PERKATAAN_SKILLS.flatMap((skill) => skill.words || []));
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

function convertToPng(source, destination) {
  const result = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", source, destination], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Could not convert ${source} to PNG.`);
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
  const selected = ranked[0];
  if (ranked.length > 1) {
    ambiguous.push(`${word} (slide ${slide.slideFile}): ${ranked.map((item) => item.media).join(", ")} -> ${selected.media}`);
  }

  const source = path.join(mediaDir, selected.media);
  const extension = path.extname(selected.media).toLowerCase();
  if (extension === ".png") {
    fs.copyFileSync(source, path.join(outputDir, `${word}.png`));
  } else if (extension === ".jpg" || extension === ".jpeg") {
    convertToPng(source, path.join(outputDir, `${word}.png`));
  } else {
    fs.copyFileSync(source, path.join(outputDir, `${word}.svg`));
  }
  mapped.push({ word, slide: slide.slideFile, media: selected.media });
}

console.log(`Mapped ${mapped.length} of ${words.size} words to PNG images.`);
if (ambiguous.length) {
  console.log("Ambiguous slides (selected largest central PNG):");
  for (const item of ambiguous) console.log(`  ${item}`);
}
if (missing.length) {
  console.log("Words without a unique PNG:");
  for (const item of missing) console.log(`  ${item}`);
}
console.log(`Output: ${outputDir}`);
