#!/usr/bin/env node
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fetchTtsAudio, writeFileAtomic } from './lib/google-tts.mjs';

const BASE = 'C:\\Users\\User\\Documents\\Pemulihan LearningApp';
const AUDIO_DIR = path.join(BASE, 'public', 'audio', 'syllables', 'KV');
const TEMP_DIR = path.join(BASE, 'temp-splice');
const MANIFEST = path.join(BASE, 'public', 'audio', 'syllables', 'manifest.csv');

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

console.log('Audio splicing: building we/ye from consonant + vowel parts\n');

// Step 1: Generate source audio for consonants
console.log('[1/4] Generating consonant sources...');

const consonants = [
  { syllable: 'we', query: '我', locale: 'zh-CN', label: 'w-onset' },
  { syllable: 'ye', query: '也', locale: 'zh-CN', label: 'y-onset' }
];

for (const { syllable, query, locale, label } of consonants) {
  const tempFile = path.join(TEMP_DIR, `${label}-source.mp3`);
  console.log(`  ${label}: "${query}" @ ${locale}`);
  
  const { bytes } = await fetchTtsAudio(query, { tl: locale });
  writeFileAtomic(tempFile, bytes);
}

// Step 2: Use existing e-pepet vowel as the schwa source
console.log('\n[2/4] Using existing e-pepet vowel as schwa source...');
const schwaSource = path.join(AUDIO_DIR, 'KV_te_e-pepet.mp3');
console.log(`  schwa from: te (特)`);

// Step 3: Splice consonant onsets with schwa vowel
console.log('\n[3/4] Splicing consonant + vowel...');

for (const { syllable, label } of consonants) {
  const consonantFile = path.join(TEMP_DIR, `${label}-source.mp3`);
  const consonantPart = path.join(TEMP_DIR, `${label}-part.mp3`);
  const vowelPart = path.join(TEMP_DIR, `schwa-part.mp3`);
  const splicedRaw = path.join(TEMP_DIR, `${syllable}-spliced-raw.mp3`);
  const outputFile = path.join(AUDIO_DIR, `KV_${syllable}_e-pepet.mp3`);
  
  console.log(`  ${syllable}:`);
  
  // Extract first 80ms of consonant (the onset)
  console.log(`    - extract ${label} onset (0-80ms)`);
  execFileSync('ffmpeg', ['-y', '-i', consonantFile, '-ss', '0', '-t', '0.08', '-af', 'afade=t=out:st=0.06:d=0.02', consonantPart], { stdio: 'ignore' });
  
  // Extract vowel portion from te (skip first 60ms to avoid the "t" consonant)
  console.log(`    - extract schwa vowel from te (60ms onward)`);
  execFileSync('ffmpeg', ['-y', '-i', schwaSource, '-ss', '0.06', '-af', 'afade=t=in:st=0:d=0.02', vowelPart], { stdio: 'ignore' });
  
  // Concatenate with crossfade at the junction
  console.log(`    - concatenate with crossfade`);
  execFileSync('ffmpeg', ['-y', '-i', consonantPart, '-i', vowelPart, '-filter_complex', '[0][1]concat=n=2:v=0:a=1[out]', '-map', '[out]', splicedRaw], { stdio: 'ignore' });
  
  // Trim silence and normalize duration to ~300-350ms
  console.log(`    - trim silence and normalize`);
  execFileSync('ffmpeg', ['-y', '-i', splicedRaw, '-af', 'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB,areverse,afade=t=in:st=0:d=0.02,afade=t=out:st=0.28:d=0.02', '-t', '0.35', outputFile], { stdio: 'ignore' });
  
  console.log(`    ✓ ${outputFile}`);
}

// Step 4: Update manifest
console.log('\n[4/4] Updating manifest...');

let csv = readFileSync(MANIFEST, 'utf8');
const lines = csv.split('\n');
const header = lines[0];
const rows = lines.slice(1).filter(l => l.trim());

for (const { syllable, query, locale } of consonants) {
  const key = `KV,${syllable},e-pepet`;
  const idx = rows.findIndex(r => r.startsWith(key));
  
  if (idx >= 0) {
    rows[idx] = `${key},${locale},${query},sound-alike-zh,spliced`;
    console.log(`  updated: ${syllable}`);
  }
}

writeFileSync(MANIFEST, [header, ...rows].join('\n') + '\n');
console.log('\nDone! Spliced audio ready.');
