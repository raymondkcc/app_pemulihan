// Helpers for pulling Google Translate TTS audio for a given text + locale.
// Kept dependency free so `node scripts/...` works on a bare checkout.
import fs from 'node:fs';
import path from 'node:path';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const LAYER3_FRAMES = { 3: 1152, 2: 1152, 1: 576 };
const BITRATES = {
  3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  1: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
};
const SAMPLE_RATES = {
  3: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  1: [11025, 12000, 8000]
};

export function ttsUrl(text, tl = 'ms') {
  const params = new URLSearchParams({
    ie: 'UTF-8',
    q: text,
    tl,
    client: 'tw-ob',
    at: 'gtx',
    ttssystem: 'x-web-client'
  });
  return `https://translate.google.com/translate_tts?${params.toString()}`;
}

// Walk the MPEG frame headers so we can sanity check how long the clip is
// without shipping ffmpeg as a build dependency.
export function mp3DurationMs(buffer) {
  let offset = 0;
  if (buffer.length > 10 && buffer.toString('latin1', 0, 3) === 'ID3') {
    const size =
      ((buffer[6] & 0x7f) << 21) |
      ((buffer[7] & 0x7f) << 14) |
      ((buffer[8] & 0x7f) << 7) |
      (buffer[9] & 0x7f);
    offset = 10 + size;
  }

  let duration = 0;
  let frames = 0;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff || (buffer[offset + 1] & 0xe0) !== 0xe0) {
      offset += 1;
      continue;
    }
    const header = buffer.readUInt32BE(offset);
    const versionBits = (header >> 19) & 0x03;
    const layerBits = (header >> 17) & 0x03;
    const bitrateIndex = (header >> 12) & 0x0f;
    const sampleIndex = (header >> 10) & 0x03;
    const padding = (header >> 9) & 0x01;
    if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) {
      offset += 1;
      continue;
    }

    const versionKey = versionBits === 3 ? 3 : versionBits === 2 ? 2 : 1;
    const layer3Key = layerBits === 1 ? 1 : 2;
    const tableVersion = layerBits === 1 ? 1 : versionKey;
    const bitrate = BITRATES[tableVersion]?.[bitrateIndex] ?? 0;
    const sampleRate = SAMPLE_RATES[tableVersion]?.[sampleIndex] ?? 0;
    if (!bitrate || !sampleRate) {
      offset += 1;
      continue;
    }

    const samplesPerFrame = LAYER3_FRAMES[layer3Key] ?? 576;
    const frameBytes = layer3Key === 3
      ? Math.floor((144000 * bitrate) / sampleRate) + padding * 1
      : Math.floor((72000 * bitrate) / sampleRate) + padding * 1;

    duration += (samplesPerFrame / sampleRate) * 1000;
    frames += 1;
    offset += Math.max(frameBytes, 4);
  }

  return { durationMs: Math.round(duration), frames };
}

async function requestTts(url) {
  const response = await fetch(url, { headers: { 'User-Agent': BROWSER_UA, Referer: 'https://translate.google.com/' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new Error('empty response');
  return bytes;
}

export async function fetchTtsAudio(text, { tl = 'ms', attempts = 4, baseDelayMs = 900 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const bytes = await requestTts(ttsUrl(text, tl));
      const { durationMs, frames } = mp3DurationMs(bytes);
      if (!frames || durationMs < 120) throw new Error(`suspicious clip (${durationMs}ms, ${frames} frames)`);
      return { bytes, durationMs, frames };
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        // Google throttles bursts; back off before the next try.
        await sleep(baseDelayMs * 2 ** attempt);
      }
    }
  }
  throw new Error(`TTS failed for "${text}": ${lastError?.message || 'unknown error'}`);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function writeFileAtomic(filepath, bytes) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  const temp = `${filepath}.tmp`;
  fs.writeFileSync(temp, bytes);
  fs.renameSync(temp, filepath);
}
