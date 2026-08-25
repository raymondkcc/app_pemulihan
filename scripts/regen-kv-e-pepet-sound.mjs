/**
 * Regenerate the e-pepet KV syllables with the Chinese / Hindi "sound-alike"
 * text the user chose, so each clip is one clean Malay syllable instead of the
 * old Malay carrier-word render.
 *
 * Most syllables feed a single Mandarin hanzi to a zh-CN voice (赫 / 么 / 特 /
 * 则).  "be" has no Chinese schwa, so it feeds the Devanagari ब to a Hindi
 * voice, whose inherent /ə/ matches the Malay pepet.  "we" (无二) and "ye"
 * (一二) are two-character compounds the user wants "pronounced fast", so the
 * script stretches the clip with atempo to collapse the two syllables.
 *
 * The bare vowel "e" is also regenerated (二 at zh-CN) into
 * public/audio/vowels/e-pepet.mp3, which the KV table's vowel row plays.
 *
 * Usage:
 *   node scripts/regen-kv-e-pepet-sound.mjs            # regenerate all targets
 *   node scripts/regen-kv-e-pepet-sound.mjs --dry-run
 *   node scripts/regen-kv-e-pepet-sound.mjs --no-manifest
 *   node scripts/regen-kv-e-pepet-sound.mjs --only=be,ne
 */

import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseManifestCsv, toManifestCsv } from './lib/syllable-table.mjs';
import { fetchTtsAudio, mp3DurationMs, writeFileAtomic, sleep } from './lib/google-tts.mjs';

const root = process.cwd();
const kvDir = path.join(root, 'public', 'audio', 'syllables', 'KV');
const vowelDir = path.join(root, 'public', 'audio', 'vowels');
const manifestPath = path.join(root, 'public', 'audio', 'syllables', 'manifest.csv');

// The query text the user picked for each e-pepet suku kata.
//
//  ne is fed 呢 rather than 呐: a zh-CN voice reads single 呐 as nà ("na"), a
//  front vowel that no longer sounds like the Malay pepet, whereas 呢 is the
//  neutral-tone "ne" /nə/ the learner is aiming for.
//  ze is fed 则 rather than 着: 着 reads zhe with a retroflex zh, while 则 is
//  the pinyin zé /tsɤ/ that stays on the closer "ze" the learner is after.
const KV_TARGETS = {
  be: { query: 'ब', tl: 'hi', status: 'sound-alike-hi' },
  he: { query: '赫', tl: 'zh-CN', status: 'sound-alike-zh' },
  me: { query: '么', tl: 'zh-CN', status: 'sound-alike-zh' },
  ne: { query: '呢', tl: 'zh-CN', status: 'sound-alike-zh' },
  te: { query: '特', tl: 'zh-CN', status: 'sound-alike-zh' },
  we: { query: '无二', tl: 'zh-CN', status: 'sound-alike-zh', fast: true },
  ye: { query: '一二', tl: 'zh-CN', status: 'sound-alike-zh', fast: true },
  ze: { query: '则', tl: 'zh-CN', status: 'sound-alike-zh' }
};

// The bare e-pepet vowel is played by the KV table's "Vokal" row.
const VOWEL_E = { query: '二', tl: 'zh-CN' };

// "we" / "ye" are two hanzi, so we speed the clip up to collapse them into one
// syllable-sized sound (roughly the length of the other cleaned clips).
const FAST_TARGET_MS = 420;

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

function atempoChain(rate) {
  // ffmpeg's atempo is only stable within [0.5, 2.0], so split larger stretches
  // into chained filters (we speed 无二/一二 up past 2x to collapse the two
  // hanzi into one syllable-sized sound).
  const parts = [];
  let remaining = rate;
  while (remaining > 2.0) {
    parts.push('atempo=2.0');
    remaining /= 2.0;
  }
  parts.push(`atempo=${remaining.toFixed(6)}`);
  return parts.join(',');
}

function shapeClip(trimmedMp3, finalMp3, durationMs, rate = 1) {
  // Small fade-in avoids a click from the silence cut; a short fade-out keeps
  // the open vowel from stopping abruptly while staying snappy.
  const dur = durationMs / 1000 / rate;
  const outSt = Math.max(0, dur - 0.055);
  const filter = rate === 1
    ? `afade=t=in:st=0:d=0.012,afade=t=out:st=${outSt.toFixed(4)}:d=0.055`
    : `${atempoChain(rate)},afade=t=in:st=0:d=0.012,afade=t=out:st=${outSt.toFixed(4)}:d=0.055`;
  run('ffmpeg', ['-y', '-v', 'error', '-i', trimmedMp3, '-filter:a', filter, finalMp3]);
}

async function createClip(query, tl, fast, targetPath) {
  const work = fs.mkdtempSync(path.join(root, 'scripts', '.kv-epepet-'));
  const raw = path.join(work, 'raw.mp3');
  const trimmed = path.join(work, 'trim.mp3');
  const shaped = path.join(work, 'final.mp3');
  try {
    const { bytes } = await fetchTtsAudio(query, { tl, attempts: 5 });
    writeFileAtomic(raw, bytes);
    trimSilence(raw, trimmed);
    const { durationMs } = mp3DurationMs(fs.readFileSync(trimmed));
    const rate = fast ? Math.max(1, durationMs / FAST_TARGET_MS) : 1;
    shapeClip(trimmed, shaped, durationMs, rate);
    writeFileAtomic(targetPath, fs.readFileSync(shaped));
    return { durationMs, rate };
  } catch (error) {
    throw error;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

async function main() {
  const only = (argValue('only', '') || '').split(',').map((value) => value.trim()).filter(Boolean);
  const dryRun = process.argv.includes('--dry-run');
  const noManifest = process.argv.includes('--no-manifest');
  const targets = only.length ? only : Object.keys(KV_TARGETS);

  console.log(`Regenerating e-pepet KV syllables → ${kvDir}\n`);

  let ok = 0;
  const failed = [];
  for (const syllable of targets) {
    const config = KV_TARGETS[syllable];
    if (!config) {
      console.error(`Unknown target "${syllable}". Known: ${Object.keys(KV_TARGETS).join(', ')}`);
      process.exitCode = 1;
      continue;
    }
    const target = path.join(kvDir, `KV_${syllable}_e-pepet.mp3`);
    if (dryRun) {
      console.log(`${syllable.padEnd(4)} → query "${config.query}" @ ${config.tl}${config.fast ? ' (fast)' : ''}`);
      continue;
    }

    try {
      const { durationMs, rate } = await createClip(config.query, config.tl, config.fast, target);
      ok += 1;
      console.log(`[${ok}/${targets.length}] ${syllable.padEnd(4)} query "${config.query}" @ ${config.tl}${config.fast ? ` rate=${rate.toFixed(3)}` : ''} trim=${(durationMs / 1000).toFixed(3)}s`);
    } catch (error) {
      failed.push(`${syllable}: ${error.message}`);
      console.error(`[${ok + failed.length}/${targets.length}] FAILED ${syllable} → ${error.message}`);
    }
    await sleep(260);
  }

  // The bare e-pepet vowel is not in the syllable manifest, so it is handled
  // separately. It only runs when the user did not restrict the run with --only.
  if (!only.length && !dryRun) {
    const vowelTarget = path.join(vowelDir, 'e-pepet.mp3');
    try {
      const { durationMs, rate } = await createClip(VOWEL_E.query, VOWEL_E.tl, false, vowelTarget);
      ok += 1;
      console.log(`vowel  query "${VOWEL_E.query}" @ ${VOWEL_E.tl} trim=${(durationMs / 1000).toFixed(3)}s`);
    } catch (error) {
      failed.push(`e vowel: ${error.message}`);
      console.error(`vowel FAILED → ${error.message}`);
    }
  }

  if (!dryRun && !noManifest) {
    const rows = parseManifestCsv(fs.readFileSync(manifestPath, 'utf8'));
    let updated = 0;
    for (const row of rows) {
      if (row.pattern !== 'KV') continue;
      if (row.vowel_sound !== 'e-pepet') continue;
      const config = KV_TARGETS[row.syllable];
      if (!config) continue;
      row.tts_locale = config.tl;
      row.query_text = config.query;
      row.example_word = '';
      row.status = config.status;
      updated += 1;
    }
    fs.writeFileSync(manifestPath, toManifestCsv(rows), 'utf8');
    console.log(`\nManifest: ${updated} KV rows tagged sound-alike`);
  }

  console.log(`\nDone: ${ok} regenerated, ${failed.length} failed.`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
