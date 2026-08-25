/**
 * Regenerate the flagged KV suku kata with natural pronunciation.
 *
 * Two paths, both keeping the TTS at natural pace:
 *
 *  - Some CV strings read straight through as a clean syllable ("ba", "ga",
 *    "la", "ma", "pa", "sa", "va"). Google reads those naturally, so we keep
 *    the bare render exactly like the app's "ca"/"fa"/"ha".
 *  - Others the Malay voice either reads as an English word ("he", "me", "no",
 *    "to") or draws the a-row into "be-a". Those come from a real Malay carrier
 *    word, trimmed to its first syllable, then slowed only as much as needed
 *    (never below 0.6x) to stay clear without sounding robotic.
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
import { fetchTtsAudio, writeFileAtomic, sleep } from './lib/google-tts.mjs';

const root = process.cwd();
const kvDir = path.join(root, 'public', 'audio', 'syllables', 'KV');
const manifestPath = path.join(root, 'public', 'audio', 'syllables', 'manifest.csv');
const trimScript = path.join(root, 'scripts', 'lib', 'trim_first_syllable.py');

// A stable single-vowel render; the bare CV string is already the natural sound.
const BARE = new Set(['ba', 'ga', 'la', 'ma', 'pa', 'sa', 'va']);

// A real Malay word whose first syllable is the target CV. Chosen so the cut
// lands before a clean /h/ or voiceless-stop pocket.
const CARRIERS = {
  'co:standard': 'cotok',
  'da:standard': 'dahan',
  'do:standard': 'dokar',
  'hi:standard': 'hitung',
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
  'ze:e-pepet': 'zeta',
  'he:e-taling': 'helikopter',
  'me:e-taling': 'meja',
  'ne:e-taling': 'netral',
  'te:e-taling': 'teater',
  'we:e-taling': 'wedang',
  'ye:e-taling': 'yesus',
  'ze:e-taling': 'zebra'
};

// Keep the carrier syllables clear but not robotic: floor 0.6x, target ~0.36s.
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

function shapeClip(trimMp3, finalMp3, trimDuration) {
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
    const carrier = CARRIERS[`${entry.syllable}:${entry.eSound || 'standard'}`];
    if (!isBare(entry) && !carrier) return false;
    return !only.length || only.includes(entry.syllable) || only.includes(entry.key);
  });

  console.log(`Regenerating ${entries.length} KV files (tl=${TTS_LOCALE})`);

  let ok = 0;
  const failed = [];
  for (const entry of entries) {
    const target = path.join(kvDir, entry.file.replace(/^KV\//, ''));
    if (dryRun) {
      console.log(`${entry.key.padEnd(12)} → ${isBare(entry) ? `bare "${entry.syllable}"` : `carrier "${CARRIERS[`${entry.syllable}:${entry.eSound || 'standard'}`]}"`}`);
      continue;
    }

    const work = fs.mkdtempSync(path.join(root, 'scripts', '.kv-regen-'));
    try {
      if (isBare(entry)) {
        const { bytes } = await fetchTtsAudio(entry.syllable, { tl: TTS_LOCALE, attempts: 5 });
        writeFileAtomic(target, bytes);
        ok += 1;
        console.log(`[${ok}/${entries.length}] ${entry.key.padEnd(12)} bare "${entry.syllable}"`);
        continue;
      }
      const carrier = CARRIERS[`${entry.syllable}:${entry.eSound || 'standard'}`];
      const carrierMp3 = path.join(work, 'carrier.mp3');
      const trimMp3 = path.join(work, 'trim.mp3');
      const { bytes } = await fetchTtsAudio(carrier, { tl: TTS_LOCALE, attempts: 5 });
      writeFileAtomic(carrierMp3, bytes);
      const payload = JSON.parse(trimCarrier(carrierMp3, trimMp3).trim());
      if (!payload.ok) throw new Error(JSON.stringify(payload));
      const rate = shapeClip(trimMp3, target, payload.duration);
      ok += 1;
      console.log(`[${ok}/${entries.length}] ${entry.key.padEnd(12)} carrier "${carrier.padEnd(10)}" trim=${payload.duration.toFixed(3)} rate=${rate.toFixed(3)}`);
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
