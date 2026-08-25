"""Trim a Malay carrier word down to just its first syllable.

Google Translate TTS reads a bare CV string badly (English words, or a
drawn-out "be-a" for the "a" row), but it reads a real word cleanly. The trick
is to ask for a word that starts with the target syllable and then cut before
the second syllable's consonant onset. For a CV1-CV2 word that onset is a
voiceless plosive (/p t k/) most of the time, so there is a clean energy dip.

Usage:
  python scripts/lib/trim_first_syllable.py input.mp3 output.mp3 [--debug]

This is deliberately dependency-light: ffmpeg for I/O, numpy for the envelope.
"""

import argparse
import json
import subprocess
import sys

import numpy as np

SR = 16000
FRAME = 256
HOP = 128


def load_audio(path):
    cmd = [
        "ffmpeg", "-v", "error", "-i", path, "-f", "f32le",
        "-ac", "1", "-ar", str(SR), "-",
    ]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64), raw


def write_audio(path, raw):
    """Re-encode raw f32le mono at SR back to a same-rate MP3 via ffmpeg."""
    cmd = [
        "ffmpeg", "-y", "-v", "error", "-f", "f32le",
        "-ar", str(SR), "-ac", "1", "-i", "-",
        "-codec:a", "libmp3lame", "-b:a", "128k", path,
    ]
    subprocess.run(cmd, input=raw, capture_output=True, check=True)


def export_wav_region(path, start_s, end_s):
    """Return raw f32le mono audio for the [start_s, end_s) region."""
    cmd = [
        "ffmpeg", "-v", "error", "-i", path,
        "-ss", f"{start_s:.3f}", "-t", f"{end_s - start_s:.3f}",
        "-f", "f32le", "-ac", "1", "-ar", str(SR), "-",
    ]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64), raw


def envelope(x):
    n = max(0, (len(x) - FRAME) // HOP + 1)
    idx = np.arange(FRAME)[None, :] + HOP * np.arange(n)[:, None]
    frames = x[idx] * np.hanning(FRAME)
    return np.sqrt((frames ** 2).mean(axis=1) + 1e-12)


def voiced_start(rms):
    """First frame that clears the noise floor and stays voiced for a bit."""
    peak = rms.max()
    floor = np.quantile(rms, 0.05)
    # A word-initial /s f h/ is a voiceless fricative: high-frequency energy
    # that sits well below the vowel RMS. The old 6% threshold dropped it, so use
    # a 2% floor and a small absolute floor so the leading TTS silence
    # (rms ~1e-4) is still rejected.
    loose = max(peak * 0.02, floor * 2, 3e-4)
    keep = rms > loose
    if not keep.any():
        return 0
    return int(np.argmax(keep))


def first_vowel_peak(rms):
    """First frame where the envelope has genuinely arrived at the vowel."""
    peak = rms.max()
    strong = 0.40 * peak
    for i, value in enumerate(rms):
        if value >= strong:
            return i
    return int(np.argmax(rms))


def inter_syllable_closure(rms, vowel_peak, relaxed=False):
    """Start of the first near-silence that follows the first vowel peak.

    For a CV1-CV2 word whose second onset is a voiceless plosive (/p t k/) the
    closure is a genuine quiet pocket, so this is the end of syllable 1. We only
    accept a pocket that is both deep enough and (for a two-syllable word)
    followed by a clear rise into the next vowel.
    """
    peak = rms.max()
    # "ba pa" closes into a voiceless stop: a genuine near-silence. A vowel or
    # glide /h j w/ keeps some energy, so allow a shallow pocket when relaxed.
    deep = 0.18 * peak if relaxed else 0.05 * peak
    min_gap = 2
    pos = vowel_peak + 1
    while pos < len(rms) - min_gap:
        if rms[pos] < deep:
            j = pos
            while j < len(rms) and rms[j] < deep:
                j += 1
            if j - pos >= min_gap:
                # Prefer a boundary that recovers into a second syllable.
                tail = rms[j:j + 8]
                recover_floor = 0.30 * peak if relaxed else 0.55 * peak
                recovers = len(tail) and tail.max() > recover_floor
                # A drop to the end is the end of a full word, still a valid cut,
                # but less useful for a syllable that should feel live.
                if recovers or j >= len(rms) - 2:
                    return pos
            pos = j + 1
        else:
            pos += 1
    return None


def first_syllable_bounds(path, relaxed=False):
    x, raw = load_audio(path)
    rms = envelope(x)
    start = voiced_start(rms)
    vowel_peak = first_vowel_peak(rms)
    closure = inter_syllable_closure(rms, vowel_peak, relaxed)
    if closure is None:
        return None
    start_s = start * HOP / SR
    end_s = closure * HOP / SR
    if start_s >= end_s or not (0.08 < end_s - start_s < 0.65):
        return None
    return round(start_s, 3), round(end_s, 3)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--relaxed", action="store_true")
    args = parser.parse_args()

    bounds = first_syllable_bounds(args.input, args.relaxed)
    if bounds is None:
        print(json.dumps({"ok": False, "reason": "no clean first-syllable boundary"}))
        return 1
    start_s, end_s = bounds
    _, raw = export_wav_region(args.input, start_s, end_s)
    write_audio(args.output, raw)
    print(json.dumps({"ok": True, "start": start_s, "end": end_s, "duration": end_s - start_s}))
    if args.debug:
        sys.stderr.write(f"trimmed to [{start_s}, {end_s}] ({end_s - start_s:.3f}s)\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
