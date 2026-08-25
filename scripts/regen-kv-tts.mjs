/**
 * Regenerate every KV suku kata in Malay with Google Translate TTS.
 *
 * Why this exists: the shipped files were built with the wrong locales
 * ("id-MY" and even "hi" / Devanagari), so "ca" was read in English and the
 * "e pepet" rows were actually Hindi. This uses tl=ms for all 126 rows and
 * spellings that stop the voice from falling back to English for function-word
 * lookalikes ("be", "me", "we", "he").
 *
 * Usage:
 *   node scripts/regen-kv-tts.mjs            # regenerate all 126
 *   node scripts/regen-kv-tts.mjs --only=be,me,we
 *   node scripts/regen-kv-tts.mjs --dry-run
 *   node scripts/regen-kv-tts.mjs --delay=400
 */

import path from 'node:path';
import { kvEntries, kvSyllableFile, TTS_LOCALE } from './lib/syllable-table.mjs';
import { fetchTtsAudio, writeFileAtomic, sleep } from './lib/google-tts.mjs';

const root = process.cwd();
const outRoot = path.join(root, 'public', 'audio', 'syllables');
const kvDir = path.join(outRoot, 'KV');

function argValue(name, fallback) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.split('=').slice(1).join('=') : fallback;
}

const only = (argValue('only', '') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const dryRun = process.argv.includes('--dry-run');
const delay = Number(argValue('delay', '260')) || 260;

/**
 * One row can need a nudge so the Malay voice cannot read it as an English word.
 * "ke." (not "ke") is the version where the voice settles on the pepet schwa;
 * "kée" is how we force the front e (taling) that the app keeps separate.
 */
function queryFor(entry) {
  if (entry.eSound === 'e-pepet') return `${entry.syllable}.`;
  if (entry.eSound === 'e-taling') return `${entry.syllable}\u00e9e`;
  return entry.syllable;
}

const entries = kvEntries().filter((entry) => !only.length || only.includes(entry.syllable) || only.includes(entry.key));
console.log(`Regenerating ${entries.length} KV files → ${kvDir} (tl=${TTS_LOCALE})`);

let ok = 0;
let failed = [];

for (const entry of entries) {
  const target = path.join(kvDir, entry.file.replace(/^KV\//, ''));
  const query = queryFor(entry);
  if (dryRun) {
    console.log(`${entry.key.padEnd(12)} → "${query}"`);
    continue;
  }
  try {
    const { bytes, durationMs } = await fetchTtsAudio(query, { tl: TTS_LOCALE, attempts: 5 });
    writeFileAtomic(target, bytes);
    console.log(`[${ok + failed.length + 1}/${entries.length}] ${entry.key.padEnd(12)} ${query.padEnd(8)} ${String(durationMs).padStart(5)}ms`);
    ok += 1;
  } catch (error) {
    failed.push(`${entry.key}: ${error.message}`);
    console.error(`[${ok + failed.length}/${entries.length}] FAILED ${entry.key} → ${error.message}`);
  }
  await sleep(delay);
}

if (!dryRun) {
  console.log(`\nDone: ${ok} regenerated, ${failed.length} failed.`);
  if (failed.length) console.log(failed.join('\n'));
}
