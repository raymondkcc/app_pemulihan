"""Objective checks for the KV suku kata audio.

Pronunciation is hard to eyeball, so this measures it:
  * formants (F1/F2) for the vowel, so "e pepet" and "e taling" must differ
  * high band noise in the onset, so "ca" has to behave like "cha", not "ka"
  * log mel DTW similarity, so no two suku kata can share the same take

Usage:
  python scripts/qa/kv-syllable-audio-qa.py compare <glob>
  python scripts/qa/kv-syllable-audio-qa.py table <dir or glob> [--json out.json]
"""

import glob as globlib
import json
import os
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
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    return np.concatenate([x, np.zeros(SR)])


def frame_signal(x):
    count = max(0, (len(x) - FRAME) // HOP + 1)
    idx = np.arange(FRAME)[None, :] + HOP * np.arange(count)[:, None]
    frames = x[idx] * np.hanning(FRAME)
    return frames


def spectrum(frames):
    return np.abs(np.fft.rfft(frames, n=1024)) / FRAME


def voiced_bounds(mag):
    rms = np.sqrt((mag**2).mean(axis=1)) + 1e-12
    peak = rms.max()
    floor = np.quantile(rms, 0.05)
    keep = rms > max(peak * 0.06, floor * 3)
    if not keep.any():
        return 0, len(rms)
    return int(np.argmax(keep)), int(len(rms) - np.argmax(keep[::-1]))


def lpc_formants(frame, order=12):
    """Autocorrelation LPC with bandwidth expansion, then envelope peaks."""
    x = frame - frame.mean()
    if np.abs(x).max() < 1e-4:
        return 0.0, 0.0
    x[0] -= 0.68 * x[-1]
    x = x[1:] - 0.68 * x[:-1]
    x = x * np.hanning(len(x))
    raw = np.correlate(x, x, mode="full")[len(x) - 1:]
    n = order + 1
    rhs = raw[1:n + 1]
    corr = raw[:n] * np.exp(-np.pi * (np.arange(n) * 0.0125) ** 2)
    if corr[0] <= 0:
        return 0.0, 0.0
    try:
        lpc = np.linalg.solve(toeplitz(corr), rhs)
    except np.linalg.LinAlgError:
        return 0.0, 0.0
    a_poly = np.concatenate([[1.0], -lpc])
    freq = np.linspace(0, SR / 2, 4096)
    response = 1.0 / np.abs(np.polyval(a_poly, np.exp(-2j * np.pi * freq / SR)))
    envelope = np.log(response + 1e-9)
    smooth = np.ones(25) / 25
    envelope = np.convolve(envelope, smooth, mode="same")
    peaks = [
        freq[i]
        for i in range(2, len(envelope) - 2)
        if envelope[i] > envelope[i - 1]
        and envelope[i] >= envelope[i + 1]
        and 200 < freq[i] < 3300
    ]
    if not peaks:
        return 0.0, 0.0
    # F1 and F2 are simply the two lowest envelope peaks in the vowel range.
    f1 = min([f for f in peaks if f <= 1100], default=0.0)
    f2 = min([f for f in peaks if f > f1 + 250], default=0.0)
    return float(f1), float(f2)


def toeplitz(first_col):
    n = len(first_col)
    out = np.empty((n, n))
    for i in range(n):
        for j in range(n):
            out[i, j] = first_col[abs(i - j)]
    return out


F2_BAND = (700, 3400)


def frontness(frames):
    """Energy centroid inside the F2 band: a proxy for how front the vowel is.

    Peak picking on a 1 second TTS clip is fragile, this is not. Ordering to
    expect: a / o / u low, pepet schwa mid, e taling higher, i highest.
    """
    power = (spectrum(frames) ** 2).mean(axis=0)
    freq = np.linspace(0, SR / 2, len(power))
    keep = (freq >= F2_BAND[0]) & (freq <= F2_BAND[1])
    weights = power[keep]
    if weights.sum() <= 0:
        return 0.0
    return float((freq[keep] * weights).sum() / weights.sum())


def mel_filterbank(bands=40, lo=80, hi=SR / 2):
    bins = 513
    freq = np.linspace(0, SR / 2, bins)
    def hz_to_mel(f):
        return 2595 * np.log10(1 + f / 700)
    def mel_to_hz(m):
        return 700 * (10 ** (m / 2595) - 1)
    points = mel_to_hz(np.linspace(hz_to_mel(lo), hz_to_mel(hi), bands + 2))
    weights = np.zeros((bands, bins))
    for i in range(bands):
        left, mid, right = points[i], points[i + 1], points[i + 2]
        up = (freq - left) / max(mid - left, 1e-6)
        down = (right - freq) / max(right - mid, 1e-6)
        weights[i] = np.clip(np.minimum(up, down), 0, None)
    return weights


MEL = mel_filterbank()


def mel_frames(x):
    power = spectrum(frame_signal(x))[:, :513] ** 2
    feats = np.log(MEL @ power.T + 1e-8).T
    return feats - feats.mean(axis=0, keepdims=True)


def dtw_distance(a, b):
    n, m = len(a), len(b)
    cost = np.full((n + 1, m + 1), np.inf)
    cost[0, 0] = 0
    for i in range(1, n + 1):
        d = np.sqrt(((a[i - 1][None, :] - b) ** 2).mean(axis=1))
        prev = cost[i - 1]
        row = np.empty(m + 1)
        row[0] = np.inf
        for j in range(1, m + 1):
            row[j] = d[j - 1] + min(prev[j], row[j - 1], prev[j - 1])
        cost[i] = row
    return float(cost[n, m] / min(n, m))


def analyse(path):
    x = load_audio(path)
    frames = frame_signal(x)
    mag = spectrum(frames)
    start, end = voiced_bounds(mag)
    span = max(end - start, 1)
    hi_bin = int(3500 / (SR / 2) * 512)
    band = mag[:, hi_bin:].mean(axis=1)
    wide = mag.mean(axis=1)
    onset_slice = slice(start, min(start + 10, end))
    onset_noise = float(band[onset_slice].mean() / (wide[onset_slice].mean() + 1e-9))
    voice = frames[start:end]
    if len(voice) < 4:
        voice = frames[max(0, len(frames) // 2 - 2):len(frames) // 2 + 2]
    mid = voice[int(len(voice) * 0.6): int(len(voice) * 0.85) + 1]
    if len(mid) == 0:
        mid = voice
    f1, f2 = [], []
    for frame in mid:
        a, b = lpc_formants(frame)
        f1.append(a)
        f2.append(b)
    # Energy centroid over the F2 band: a steady read of how front the vowel is.
    power = spectrum(mid).mean(axis=0)
    lo = int(700 / (SR / 2) * 512)
    hi = int(3400 / (SR / 2) * 512)
    bins = np.arange(len(power)) * (SR / 2) / 512
    frontness = float((bins[lo:hi] * power[lo:hi]).sum() / (power[lo:hi].sum() + 1e-12))
    rms = np.sqrt((frames[start:end] ** 2).mean(axis=1) + 1e-12) if end > start else np.array([0.0])
    voiced = int((rms > rms.max() * 0.12).sum())
    return {
        "file": os.path.basename(path),
        "ms": voiced * HOP / SR * 1000,
        "f1": float(np.median(f1)) if f1 else 0.0,
        "f2": float(np.median(f2)) if f2 else 0.0,
        "front": round(frontness),
        "onset_noise": round(onset_noise, 3),
        "peak": round(float(np.abs(x).max()), 3),
        "_audio": x,
    }


def expand(target):
    if os.path.isdir(target):
        return sorted(globlib.glob(os.path.join(target, "*.mp3")))
    return sorted(globlib.glob(target))


def cmd_table(paths, json_out=None):
    rows = []
    for path in paths:
        row = analyse(path)
        row.pop("_audio", None)
        rows.append(row)
    header = (
        f"{'file':<26}{'ms':>7}{'F1':>7}{'F2':>7}{'front':>7}"
        f"{'onset noise':>13}{'peak':>7}"
    )
    print(header)
    print("-" * len(header))
    for row in rows:
        print(
            f"{row['file']:<26}{row['ms']:>7.0f}{row['f1']:>7.0f}"
            f"{row['f2']:>7.0f}{row['front']:>7.0f}{row['onset_noise']:>13.2f}"
            f"{row['peak']:>7.2f}"
        )
    by_vowel = {}
    for row in rows:
        stem = os.path.splitext(row["file"])[0].split("_")[-1]
        vowel = "".join(ch for ch in stem if ch in "aeiou")[-1:] or "?"
        by_vowel.setdefault(vowel, []).append(row)
    print("\nvowel medians (F2 must rise a < o/u < e pepet < e taling < i)")
    for vowel, group in sorted(by_vowel.items()):
        print(
            f"  {vowel:<10} n={len(group):<4}"
            f"openness {np.median([g['f1'] for g in group]):>6.0f}"
            f"  frontness {np.median([g['front'] for g in group]):>6.0f}"
        )
    if json_out:
        with open(json_out, "w", encoding="utf-8") as handle:
            json.dump(rows, handle, indent=1)
        print(f"\nwrote {json_out}")


def cmd_compare(paths):
    """Print which reference each clip is closest to, by log mel DTW."""
    items = [(os.path.splitext(os.path.basename(p))[0], analyse(p)) for p in paths]
    feats = {name: mel_frames(row["_audio"]) for name, row in items}
    print(f"{'clip':<26}{'ms':>7}{'F2':>7}{'noise':>7}   closest neighbours")
    for name, row in items:
        scores = []
        for other, _ in items:
            if other == name:
                continue
            scores.append((dtw_distance(feats[name], feats[other]), other))
        scores.sort()
        neighbours = "  ".join(f"{n}:{d:.2f}" for d, n in scores[:3])
        print(
            f"{name:<26}{row['ms']:>7.0f}{row['f2']:>7.0f}"
            f"{row['onset_noise']:>7.2f}   {neighbours}"
        )


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return 1
    mode, target = sys.argv[1], sys.argv[2]
    rest = sys.argv[3:]
    json_out = None
    if "--json" in rest:
        json_out = rest[rest.index("--json") + 1]
    paths = expand(target)
    if not paths:
        print(f"no mp3 files for {target}")
        return 1
    if mode == "compare":
        return cmd_compare(paths)
    return cmd_table(paths, json_out)


if __name__ == "__main__":
    sys.exit(main() or 0)
