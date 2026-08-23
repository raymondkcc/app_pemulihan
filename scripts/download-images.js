import { getAllWords } from '../src/data/perkataan.js';
import { WORD_EMOJIS } from '../src/data/wordEmojis.js';
import fs from 'fs';
import path from 'path';

const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'perkataan');

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

function emojiToTwemojiName(emoji) {
  const codePoints = [];
  for (const char of emoji) {
    const code = char.codePointAt(0);
    // Twemoji uses unpadded lowercase hex; keep FE0F so we can strip it separately
    if (code === 0xfe0f) continue;
    codePoints.push(code.toString(16));
  }
  return codePoints.join('-');
}

async function downloadFile(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
}

const words = getAllWords();
const uniqueWords = [...new Set(words)];

console.log(`Checking ${uniqueWords.length} unique words for emoji images...`);

let downloaded = 0;
let skipped = 0;
let missing = 0;

for (const word of uniqueWords) {
  const emoji = WORD_EMOJIS[word] || WORD_EMOJIS[word.toLowerCase()];
  const filepath = path.join(IMAGE_DIR, `${word}.png`);

  if (!emoji) {
    if (!fs.existsSync(filepath)) {
      missing++;
    }
    continue;
  }

  if (fs.existsSync(filepath)) {
    skipped++;
    continue;
  }

  const twemojiName = emojiToTwemojiName(emoji);
  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${twemojiName}.png`;

  try {
    await downloadFile(url, filepath);
    downloaded++;
    console.log(`[${downloaded}] ${word} -> ${emoji}`);
  } catch (error) {
    console.error(`Failed ${word}:`, error.message);
  }

  await new Promise((resolve) => setTimeout(resolve, 120));
}

console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Missing emoji: ${missing}`);
