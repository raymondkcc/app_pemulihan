/**
 * Regenerate the user's 12 flagged KV "a"-row syllables with a Chinese
 * Mandarin voice reading the pinyin instead of the Malay TTS.
 *
 * The user was not satisfied with the bare-CV Malay renders (English word
 * readings, drawn-out "be-a"), and asked for the audio to use the pinyin of
 * the character they picked for each syllable so it "sounds natural". A zh-CN
 * voice reads a pinyin syllable like ba / da / sa as a clean single syllable.
 * (Feeding 煞 or 炸 to Mandarin would yield sha/zha, so we feed the pinyin text
 * the learner is aiming for: sa, za.)
 *
 * Usage:
 *   node scripts/regen-kv-zh-pinyin.mjs            # regenerate the 12 files
 *   node scripts/regen-kv-zh-pinyin.mjs --dry-run
 *   node scripts/regen-kv-zh-pinyin.mjs --no-manifest
 *   node scripts/regen-kv-zh-pinyin.mjs --only=ba,sa
 */

import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseManifestCsv, toManifestCsv } from './lib/syllable-table.mjs';
import { fetchTtsAudio, mp3DurationMs, writeFileAtomic, sleep } from './lib/google-tts.mjs';

const root = process.cwd();
const kvDir = path.join(root, 'public', 'audio', 'syllables', 'KV');
const manifestPath = path.join(root, 'public', 'audio', 'syllables', 'manifest.csv');

// The pinyin the learner aims for, chosen by the user for each Malay KV syllable.
const PINYIN = ['ba', 'da', 'ga', 'ka', 'la', 'ma', 'na', 'pa', 'sa', 'ta', 'ya', 'za'];

const TTS_LOCALE = 'zh-CN';
const STATUS = 'pinyin-zh';

function argValue(name, fallback) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : fallback;
}

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function trimSilence(infile, outfile) {
  // Cut leading/trailing silence so the clip is a short, clean syllable. The
  // double-areverse trick lets the same filter strip both ends.
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    infile,
    '-af',
    'silenceremove=start_periods=1:start_threshold=-35dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-35dB:start_silence=0.10,areverse',
    outfile
  ]);
}

function shapeClip(trimmedMp3, finalMp3, durationMs) {
  // Small fade-in avoids a click from the silence cut; a short fade-out keeps
  // the open vowel from stopping abruptly while staying snappy.
  const dur = durationMs / 1000;
  const outSt = Math.max(0, dur - 0.055);
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    trimmedMp3,
    '-af',
    `afade=t=in:st=0:d=0.012,afade=t=out:st=${outSt.toFixed(4)}:d=0.055`,
    finalMp3
  ]);
}

function manifestKey(row) {
  return `${row.syllable}:${row.vowel_sound || 'standard'}`;
}

async function main() {
  const only = (argValue('only', '') || '').split(',').map((value) => value.trim()).filter(Boolean);
  const dryRun = process.argv.includes('--dry-run');
  const noManifest = process.argv.includes('--no-manifest');
  const targets = only.length ? only : PINYIN;

  console.log(`Regenerating ${targets.length} KV syllables with ${TTS_LOCALE} pinyin voice → ${kvDir}`);

  let ok = 0;
  const failed = [];
  for (const syllable of targets) {
    const target = path.join(kvDir, `KV_${syllable}.mp3`);
    if (dryRun) {
      console.log(`${syllable.padEnd(4)} → pinyin "${syllable}" @ ${TTS_LOCALE}`);
      continue;
    }

    const work = fs.mkdtempSync(path.join(root, 'scripts', '.kv-zh-'));
    const raw = path.join(work, 'raw.mp3');
    const trimmed = path.join(work, 'trim.mp3');
    const shaped = path.join(work, 'final.mp3');
    try {
      const { bytes } = await fetchTtsAudio(syllable, { tl: TTS_LOCALE, attempts: 5 });
      writeFileAtomic(raw, bytes);
      trimSilence(raw, trimmed);
      const { durationMs } = mp3DurationMs(fs.readFileSync(trimmed));
      shapeClip(trimmed, shaped, durationMs);
      writeFileAtomic(target, fs.readFileSync(shaped));
      ok += 1;
      console.log(`[${ok}/${targets.length}] ${syllable.padEnd(4)} pinyin "${syllable}" trim=${(durationMs / 1000).toFixed(3)}s`);
    } catch (error) {
      failed.push(`${syllable}: ${error.message}`);
      console.error(`[${ok + failed.length}/${targets.length}] FAILED ${syllable} → ${error.message}`);
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
    await sleep(260);
  }

  if (!dryRun && !noManifest) {
    const rows = parseManifestCsv(fs.readFileSync(manifestPath, 'utf8'));
    let updated = 0;
    for (const row of rows) {
      if (row.pattern !== 'KV') continue;
      if (row.vowel_sound && row.vowel_sound !== 'standard') continue;
      if (!PINYIN.includes(row.syllable)) continue;
      row.tts_locale = TTS_LOCALE;
      row.query_text = row.syllable;
      row.example_word = '';
      row.status = STATUS;
      updated += 1;
    }
    fs.writeFileSync(manifestPath, toManifestCsv(rows), 'utf8');
    console.log(`\nManifest: ${updated} KV rows tagged ${STATUS}`);
  }

  console.log(`\nDone: ${ok} regenerated, ${failed.length} failed.`);
  if (failed.length) process.exitCode = 1;
}

main();
