/**
 * Regenerate the flagged KV suku kata with natural pronunciation.
 *
 * Two paths, both using a Malay carrier word when the bare CV is unreliable:
 *
 *  - Some CV strings read straight through as a clean syllable ("ba", "ga",
 *    "la", "ma", "pa", "sa", "va"). Google reads those naturally, so we keep
 *    the bare render exactly like the app's "ca"/"fa"/"ha".
 *  - Others the Malay voice either reads as an English word, draws the vowel
 *    out, or needs a distinct e-pepet vowel. Those come from a real Malay
 *    carrier word, trimmed to its first syllable, then slowed to the approved
 *    open-vowel length.
 *
 * Usage:
 *   node scripts/regen-kv-tts.mjs            # regenerate the 29 flagged KV files
 *   node scripts/regen-kv-tts.mjs --only=ba,he
 *   node scripts/regen-kv-tts.mjs --dry-run
 *   node scripts/regen-kv-tts.mjs --no-manifest
 */

import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { kvEntries, TTS_LOCALE, parseManifestCsv, toManifestCsv } from './lib/syllable-table.mjs';
import { fetchTtsAudio, mp3DurationMs, writeFileAtomic, sleep } from './lib/google-tts.mjs';

const root = process.cwd();
const kvDir = path.join(root, 'public', 'audio', 'syllables', 'KV');
const manifestPath = path.join(root, 'public', 'audio', 'syllables', 'manifest.csv');
const trimScript = path.join(root, 'scripts', 'lib', 'trim_first_syllable.py');

// A stable single-vowel render; the bare CV string is already the natural sound.
const BARE = new Set(['ba', 'ga', 'la', 'ma', 'pa', 'sa', 'va']);

// A real Malay word whose first syllable is the target CV. Chosen so the cut
// lands before a clean /h/ or voiceless-stop pocket. Keep the e-pepet entries
// on words whose first e is genuinely /ə/, rather than relying on a foreign
// sound-alike voice.
const CARRIERS = {
  'co:standard': 'cogan',
  'da:standard': 'dahan',
  'do:standard': 'dokar',
  'hi:standard': 'hitung',
  'le:e-pepet': 'lemah',
  'no:standard': 'nota',
  'to:standard': 'toge',
  'ya:standard': 'yakin',
  'za:standard': 'zahir',
  'he:e-pepet': 'hepatitis',
  'me:e-pepet': 'metro',
  'ne:e-pepet': 'nekat',
  'te:e-pepet': 'teban',
  'we:e-pepet': 'wesi',
  'ye:e-pepet': 'yeti',
  'he:e-taling': 'helikopter',
  'me:e-taling': 'meja',
  'ne:e-taling': 'netral',
  'te:e-taling': 'teater',
  'we:e-taling': 'wedang',
  'ye:e-taling': 'yesus',
  'ze:e-pepet': 'zeta',
  'ze:e-taling': 'zebra'
};

// A few targets are better represented by a single character than by a
// Malay carrier word. Keep the exact source and locale in the manifest.
const DIRECT_TARGETS = {
  'ze:e-taling': { query: '这', tl: 'zh-CN', status: 'sound-alike-zh' }
};

// The approved open-vowel treatment is a half-speed carrier syllable with a
// soft tail. It gives the learner enough time to hear the consonant and vowel.
const SLOW_OPEN = new Set([
  'co:standard',
  'do:standard',
  'hi:standard',
  'le:e-pepet',
  'no:standard',
  'to:standard',
  'ze:e-pepet'
]);
const OPEN_RATE = 0.5;
const OPEN_FADE_START = 0.46;
const OPEN_FADE_DURATION = 0.22;

// Keep the other carrier syllables clear but not robotic.
const TARGET = 0.36;
const PAD = 0.066;
const MIN_RATE = 0.6;

function argValue(name, fallback) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : fallback;
}

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function atempoChain(rate) {
  const parts = [];
  let remaining = rate;
  while (remaining < 0.5) {
    parts.push('atempo=0.5');
    remaining /= 0.5;
  }
  parts.push(`atempo=${remaining.toFixed(6)}`);
  return parts.join(',');
}

function trimCarrier(carrierMp3, trimMp3) {
  return run('python', [trimScript, '--relaxed', carrierMp3, trimMp3]);
}

function trimSilence(inputMp3, outputMp3) {
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    inputMp3,
    '-af',
    'silenceremove=start_periods=1:start_threshold=-35dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-35dB:start_silence=0.10,areverse',
    outputMp3
  ]);
}

function shapeDirectClip(trimMp3, finalMp3, durationMs) {
  const duration = durationMs / 1000;
  const fadeStart = Math.max(0, duration - 0.055);
  run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    trimMp3,
    '-filter:a',
    `afade=t=in:st=0:d=0.012,afade=t=out:st=${fadeStart.toFixed(4)}:d=0.055`,
    '-map_metadata',
    '-1',
    '-map_chapters',
    '-1',
    '-ar',
    '44100',
    '-ac',
    '1',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '64k',
    '-write_xing',
    '0',
    finalMp3
  ]);
}

function shapeClip(trimMp3, finalMp3, trimDuration, key) {
  if (SLOW_OPEN.has(key)) {
    run('ffmpeg', [
      '-y',
      '-v',
      'error',
      '-i',
      trimMp3,
      '-filter:a',
      `atempo=${OPEN_RATE},afade=t=out:st=${OPEN_FADE_START}:d=${OPEN_FADE_DURATION}`,
      finalMp3
    ]);
    return OPEN_RATE;
  }

  const rate = Math.max(MIN_RATE, Math.min(1.0, trimDuration / (TARGET - PAD)));
  const st = Math.max(0, trimDuration / rate - 0.08).toFixed(4);
  const filter = `${atempoChain(rate)},afade=t=out:st=${st}:d=0.08`;
  run('ffmpeg', ['-y', '-v', 'error', '-i', trimMp3, '-filter:a', filter, finalMp3]);
  return rate;
}

function manifestKey(row) {
  return `${row.syllable}:${row.vowel_sound || 'standard'}`;
}

function isBare(entry) {
  return !entry.eSound && BARE.has(entry.syllable);
}

async function main() {
  const only = (argValue('only', '') || '').split(',').map((value) => value.trim()).filter(Boolean);
  const dryRun = process.argv.includes('--dry-run');
  const noManifest = process.argv.includes('--no-manifest');
  const delay = Number(argValue('delay', '260')) || 260;

  const entries = kvEntries().filter((entry) => {
    const key = `${entry.syllable}:${entry.eSound || 'standard'}`;
    const carrier = CARRIERS[key];
    if (!isBare(entry) && !carrier && !DIRECT_TARGETS[key]) return false;
    return !only.length || only.includes(entry.syllable) || only.includes(entry.key);
  });

  console.log(`Regenerating ${entries.length} KV files (tl=${TTS_LOCALE})`);

  let ok = 0;
  const failed = [];
  const regeneratedKeys = new Set();
  for (const entry of entries) {
    const target = path.join(kvDir, entry.file.replace(/^KV\//, ''));
    if (dryRun) {
      const key = `${entry.syllable}:${entry.eSound || 'standard'}`;
      const direct = DIRECT_TARGETS[key];
      console.log(`${entry.key.padEnd(12)} → ${direct ? `query "${direct.query}" @ ${direct.tl}` : isBare(entry) ? `bare "${entry.syllable}"` : `carrier "${CARRIERS[key]}"`}`);
      continue;
    }

    const work = fs.mkdtempSync(path.join(root, 'scripts', '.kv-regen-'));
    try {
      if (isBare(entry)) {
        const { bytes } = await fetchTtsAudio(entry.syllable, { tl: TTS_LOCALE, attempts: 5 });
        writeFileAtomic(target, bytes);
        regeneratedKeys.add(entry.key);
        ok += 1;
        console.log(`[${ok}/${entries.length}] ${entry.key.padEnd(12)} bare "${entry.syllable}"`);
        continue;
      }
      const key = `${entry.syllable}:${entry.eSound || 'standard'}`;
      const direct = DIRECT_TARGETS[key];
      const carrierMp3 = path.join(work, 'carrier.mp3');
      const trimMp3 = path.join(work, 'trim.mp3');
      const shapedMp3 = path.join(work, 'shaped.mp3');
      const source = direct || { query: CARRIERS[key], tl: TTS_LOCALE };
      const { bytes } = await fetchTtsAudio(source.query, { tl: source.tl, attempts: 5 });
      writeFileAtomic(carrierMp3, bytes);
      let duration;
      let rate = 1;
      if (direct) {
        trimSilence(carrierMp3, trimMp3);
        duration = mp3DurationMs(fs.readFileSync(trimMp3)).durationMs;
        shapeDirectClip(trimMp3, shapedMp3, duration);
      } else {
        const payload = JSON.parse(trimCarrier(carrierMp3, trimMp3).trim());
        if (!payload.ok) throw new Error(JSON.stringify(payload));
        duration = payload.duration * 1000;
        rate = shapeClip(trimMp3, shapedMp3, payload.duration, key);
      }
      writeFileAtomic(target, fs.readFileSync(shapedMp3));
      regeneratedKeys.add(entry.key);
      ok += 1;
      console.log(`[${ok}/${entries.length}] ${entry.key.padEnd(12)} ${direct ? `query "${source.query}" @ ${source.tl}` : `carrier "${source.query}"`} trim=${(duration / 1000).toFixed(3)} rate=${rate.toFixed(3)}`);
    } catch (error) {
      failed.push(`${entry.key}: ${error.message}`);
      console.error(`[${ok + failed.length}/${entries.length}] FAILED ${entry.key} → ${error.message}`);
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
    await sleep(delay);
  }

  if (!dryRun && !noManifest) {
    const rows = parseManifestCsv(fs.readFileSync(manifestPath, 'utf8'));
    let updated = 0;
    for (const row of rows) {
      if (row.pattern !== 'KV') continue;
      const syllable = row.syllable;
      const sound = row.vowel_sound || 'standard';
      if (!row.syllable) continue;
      const key = `${syllable}${sound === 'standard' ? '' : `#${sound}`}`;
      const sourceKey = `${syllable}:${sound}`;
      if (only.length && !only.includes(syllable) && !only.includes(key)) continue;
      if (!regeneratedKeys.has(key)) continue;
      if (DIRECT_TARGETS[sourceKey]) {
        row.tts_locale = DIRECT_TARGETS[sourceKey].tl;
        row.query_text = DIRECT_TARGETS[sourceKey].query;
        row.example_word = '';
        row.status = DIRECT_TARGETS[sourceKey].status;
        updated += 1;
        continue;
      }
      if (sound === 'standard' && BARE.has(syllable)) {
        row.query_text = syllable;
        row.status = 'natural-ms';
        updated += 1;
      } else if (CARRIERS[`${syllable}:${sound}`]) {
        row.query_text = CARRIERS[`${syllable}:${sound}`];
        row.status = 'open-ms';
        updated += 1;
      }
    }
    fs.writeFileSync(manifestPath, toManifestCsv(rows), 'utf8');
    console.log(`\nManifest: ${updated} KV rows updated.`);
  }

  console.log(`\nDone: ${ok} regenerated, ${failed.length} failed.`);
  if (failed.length) console.log(failed.join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
