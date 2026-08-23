import { getAllWords } from '../src/data/perkataan.js';
import fs from 'fs';
import path from 'path';
import https from 'https';

const WORDS_DIR = path.join(process.cwd(), 'public', 'audio', 'perkataan');

// Ensure directory exists
if (!fs.existsSync(WORDS_DIR)) {
  fs.mkdirSync(WORDS_DIR, { recursive: true });
}

const words = getAllWords();
console.log(`Downloading TTS for ${words.length} words...`);

// Google Translate TTS API endpoint
function getTTSUrl(text) {
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ms&client=tw-ob`;
}

// Download file from URL
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

// Download with delay to avoid rate limiting
async function downloadAll() {
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const filepath = path.join(WORDS_DIR, `${word}.mp3`);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`[${i + 1}/${words.length}] Skipping ${word} (already exists)`);
      success++;
      continue;
    }
    
    try {
      const url = getTTSUrl(word);
      await downloadFile(url, filepath);
      console.log(`[${i + 1}/${words.length}] Downloaded ${word}`);
      success++;
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[${i + 1}/${words.length}] Failed ${word}:`, err.message);
      failed++;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

downloadAll().catch(console.error);
