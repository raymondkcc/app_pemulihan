/**
 * Scratch helper: pull a few TTS renders into a temp folder so the QA script can
 * measure them. Usage:
 *   node scripts/probe-kv-tts.mjs --out C:\temp\probe "ca_ms=ca@ms" "ka=ka"
 */

import path from 'node:path';
import { fetchTtsAudio, writeFileAtomic } from './lib/google-tts.mjs';

const args = process.argv.slice(2);
let outDir = path.join(process.env.TEMP || '/tmp', 'kv-probe');
const specs = [];

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--out') {
    outDir = args[++i];
    continue;
  }
  specs.push(args[i]);
}

for (const spec of specs) {
  const [label, rhs] = spec.includes('=') ? spec.split(/=(.*)/s) : [null, spec];
  const [encodedText, tl = 'ms'] = rhs.split('@');
  const text = decodeURIComponent(encodedText);
  try {
    const { bytes, durationMs } = await fetchTtsAudio(text, { tl });
    writeFileAtomic(path.join(outDir, `${label || rhs}.mp3`), bytes);
    console.log(`${(label || rhs).padEnd(16)} ${text.padEnd(8)} ${tl.padEnd(6)} ${String(durationMs).padStart(5)} ms  ${bytes.length} B`);
  } catch (error) {
    console.log(`${(label || rhs).padEnd(16)} ${text.padEnd(8)} ${tl.padEnd(6)} FAILED ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 260));
}
