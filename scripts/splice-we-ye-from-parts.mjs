#!/usr/bin/env node
import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fetchTtsAudio, writeFileAtomic } from './lib/google-tts.mjs';

const BASE = 'C:\\Users\\User\\Documents\\Pemulihan LearningApp';
const AUDIO_DIR = path.join(BASE, 'public', 'audio', 'syllables', 'KV');
const TEMP_DIR = path.join(BASE, 'temp-splice');
const MANIFEST = path.join(BASE, 'public', 'audio', 'syllables', 'manifest.csv');

// Ensure temp directory exists
if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

console.log('Audio splicing: building we/ye from consonant + vowel parts\n');

// Step 1: Generate source audio for consonants. Indonesian TTS gives a
// stronger voiced approximant onset than the earlier Mandarin source.
console.log('[1/4] Generating consonant sources...');

const consonants = [
  { syllable: 'we', query: 'we', locale: 'id', label: 'w-onset', start: 0.125, gainDb: 6 },
  { syllable: 'ye', query: 'ye', locale: 'id', label: 'y-onset', start: 0.105, gainDb: 10 }
];

for (const { query, locale, label } of consonants) {
  const tempFile = path.join(TEMP_DIR, `${label}-source.mp3`);
  console.log(`  ${label}: "${query}" @ ${locale}`);
  
  const { bytes } = await fetchTtsAudio(query, { tl: locale });
  writeFileAtomic(tempFile, bytes);
}

// Step 2: Use existing e-pepet vowels for the schwa body and natural tail
console.log('\n[2/4] Using existing e-pepet vowels as schwa sources...');
const schwaSource = path.join(AUDIO_DIR, 'KV_te_e-pepet.mp3');
const tailSource = path.join(AUDIO_DIR, 'KV_le_e-pepet.mp3');
console.log(`  schwa body from: te (特)`);
console.log(`  schwa tail from: le (le.)`);

// Step 3: Splice consonant onsets with schwa vowel
console.log('\n[3/4] Splicing consonant + vowel...');

for (const { syllable, label, start, gainDb } of consonants) {
  const consonantFile = path.join(TEMP_DIR, `${label}-source.mp3`);
  const legacyPart = path.join(TEMP_DIR, `${label}-part.mp3`);
  const legacyVowelPart = path.join(TEMP_DIR, 'schwa-part.mp3');
  const legacySplicedRaw = path.join(TEMP_DIR, `${syllable}-spliced-raw.mp3`);
  const outputFile = path.join(AUDIO_DIR, `KV_${syllable}_e-pepet.mp3`);

  console.log(`  ${syllable}:`);

  // Use measured 50ms voiced glide onsets. A 15ms join preserves enough of
  // the source transition for /w/ and /y/ to remain audible in isolation.
  const onsetStart = start;
  const onsetEnd = onsetStart + 0.050;
  const onsetFadeOut = onsetEnd - 0.015;
  const filter = [
    `[0]atrim=start=${onsetStart.toFixed(3)}:end=${onsetEnd.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.012,volume=${gainDb}dB,alimiter=limit=0.500:level=false,afade=t=out:st=${onsetFadeOut.toFixed(3)}:d=0.015[on]`,
    `[1]atrim=start=0.100:end=0.376,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.018[v0]`,
    `[2]atrim=start=0.100:end=0.380,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.012[v1]`,
    `[v0][v1]acrossfade=d=0.060:c1=qsin:c2=qsin[vfull]`,
    `[on][vfull]acrossfade=d=0.015:c1=qsin:c2=qsin,afade=t=out:st=0.290:d=0.055,atrim=end=0.350[out]`
  ].join(';');

  console.log(`    - splice ${label} onset + te schwa + le tail`);
  execFileSync(
    'ffmpeg',
    [
      '-y', '-i', consonantFile, '-i', schwaSource, '-i', tailSource,
      '-filter_complex', filter, '-map', '[out]', '-ac', '1', '-ar', '24000', outputFile
    ],
    { stdio: 'ignore' }
  );

  // Remove scratch artifacts from the first-generation splice.
  for (const legacy of [legacyPart, legacyVowelPart, legacySplicedRaw]) {
    if (existsSync(legacy)) rmSync(legacy);
  }
  
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
    rows[idx] = `${key},mixed,${syllable}+te+le.,,KV/KV_${syllable}_e-pepet.mp3,spliced-hybrid`;
    console.log(`  updated: ${syllable}`);
  }
}

writeFileSync(MANIFEST, [header, ...rows].join('\n') + '\n');
console.log('\nDone! Spliced audio ready.');
