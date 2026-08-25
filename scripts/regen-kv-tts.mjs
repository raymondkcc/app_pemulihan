/**
 * Regenerate the flagged KV suku kata from real Malay carrier words.
 *
 * Bare CV strings ("ba", "he", "no") are unreliable with Google Translate TTS:
 * the Malay voice reads them as English words ("he", "me", "no") or draws the
 * vowel into a two-syllable "be-a". Instead we ask for a real word that starts
 * with the target syllable ("bahan" for "ba"), trim the audio to that first
 * syllable, then slow it and fade the tail so the open vowel hangs cleanly.
 *
 *   carrier word -> trim_first_syllable.py --relaxed -> atempo=0.5 -> afade
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

// Normalise the final clip length so nothing ships as short as a clipped "pa".
// Slow each short trim atempo until it clears a ~0.60s floor; already-long
// clips keep the 0.5x recipe. PAD accounts for the mp3 frame tail plus fade.
const TARGET = 0.60;
const PAD = 0.043;

// A real Malay word whose first syllable is the target CV. The second onset is
// /h/ or a voiceless stop where possible so the trim cuts before a clean pocket.
const CARRIERS = {
  'ba:standard': 'bahan',
  'co:standard': 'cotok',
  'da:standard': 'dahan',
  'do:standard': 'dokar',
  'ga:standard': 'gaharu',
  'hi:standard': 'hitung',
  'la:standard': 'lahar',
  'ma:standard': 'maha',
  'no:standard': 'nota',
  'pa:standard': 'paham',
  'sa:standard': 'saham',
  'to:standard': 'toge',
  'va:standard': 'vakum',
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

function argValue(name, fallback) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : fallback;
}

function carrierFor(entry) {
  return CARRIERS[`${entry.syllable}:${entry.eSound || 'standard'}`] || '';
}

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function trimCarrier(carrierMp3, trimMp3) {
  return run('python', [trimScript, '--relaxed', carrierMp3, trimMp3]);
}

function atempoChain(rate) {
  // ffmpeg's atempo accepts 0.5-2.0 per instance; chain stages to go lower.
  const parts = [];
  let remaining = rate;
  while (remaining < 0.5) {
    parts.push('atempo=0.5');
    remaining /= 0.5;
  }
  parts.push(`atempo=${remaining.toFixed(6)}`);
  return parts.join(',');
}

function shapeClip(trimMp3, finalMp3, trimDuration) {
  const rate = Math.min(0.5, trimDuration / (TARGET - PAD));
  run('ffmpeg', ['-y', '-v', 'error', '-i', trimMp3, '-filter:a', `${atempoChain(rate)},afade=t=out:st=0.46:d=0.22`, finalMp3]);
}

function manifestKey(row) {
  return `${row.syllable}:${row.vowel_sound || 'standard'}`;
}

async function main() {
  const only = (argValue('only', '') || '').split(',').map((value) => value.trim()).filter(Boolean);
  const dryRun = process.argv.includes('--dry-run');
  const noManifest = process.argv.includes('--no-manifest');
  const delay = Number(argValue('delay', '260')) || 260;

  const entries = kvEntries().filter((entry) => {
    if (!carrierFor(entry)) return false;
    return !only.length || only.includes(entry.syllable) || only.includes(entry.key);
  });

  console.log(`Regenerating ${entries.length} KV files from carrier words → ${kvDir} (tl=${TTS_LOCALE})`);

  let ok = 0;
  const failed = [];
  for (const entry of entries) {
    const carrier = carrierFor(entry);
    const target = path.join(kvDir, entry.file.replace(/^KV\//, ''));
    if (dryRun) {
      console.log(`${entry.key.padEnd(12)} → "${carrier}"`);
      continue;
    }

    const work = fs.mkdtempSync(path.join(root, 'scripts', '.kv-regen-'));
    const carrierMp3 = path.join(work, 'carrier.mp3');
    const trimMp3 = path.join(work, 'trim.mp3');
    try {
      const { bytes } = await fetchTtsAudio(carrier, { tl: TTS_LOCALE, attempts: 5 });
      writeFileAtomic(carrierMp3, bytes);
      const result = trimCarrier(carrierMp3, trimMp3);
      const payload = JSON.parse(result.trim());
      if (!payload.ok) throw new Error(JSON.stringify(payload));
      shapeClip(trimMp3, target, payload.duration);
      ok += 1;
      console.log(`[${ok}/${entries.length}] ${entry.key.padEnd(12)} "${carrier.padEnd(10)}" trim=${payload.duration.toFixed(3)}s rate=${Math.min(0.5, payload.duration / (TARGET - PAD)).toFixed(4)}`);
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
    const byKey = new Map(entries.map((entry) => [`${entry.syllable}:${entry.eSound || 'standard'}`, entry]));
    let updated = 0;
    for (const row of rows) {
      const entry = byKey.get(manifestKey(row));
      if (entry) {
        row.query_text = CARRIERS[`${entry.syllable}:${entry.eSound || 'standard'}`];
        row.status = 'open-ms';
        updated += 1;
      }
    }
    fs.writeFileSync(manifestPath, toManifestCsv(rows), 'utf8');
    console.log(`\nManifest: ${updated} KV rows set to open-ms.`);
  }

  console.log(`\nDone: ${ok} regenerated, ${failed.length} failed.`);
  if (failed.length) console.log(failed.join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
