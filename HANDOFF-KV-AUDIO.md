# Handoff: Fix remaining KV syllable audio (open-vowel recipe)

## What this is

The app's KV suku kata audio is generated from Google Translate TTS (`tl=ms`).
Feeding it a bare CV string (`ba`, `he`, `hi`, `me`, `no`, `to`) is unreliable:
the Malay voice either reads a real English word (`he`, `hi`, `me`, `no`, `to`) or
draws the vowel out into "be-a" (the whole `a` row). A better source is a real
Malay word that **starts** with the target syllable, then cut the audio to just
that first syllable and shape it so the vowel stays open.

## Validated recipe (confirmed by ear)

`ba` was sampled from the Malay word **`bahan`** (ba·han). The `/h/` is a glottal
fricative, so the first `a` does not close into the lips or tongue. Cutting
before the `/h/` leaves a clean, short, open vowel that becomes a held "ba-a"
when slowed down.

The user approved this exact chain for the final sound:

```text
source word -> trim to first syllable -> atempo=0.5 -> afade out 0.22s
```

Concretely (from the working `ba` example):

```powershell
# 1. Trim the carrier word's first syllable (open-vowel mode).
python scripts/lib/trim_first_syllable.py --relaxed "bahan.mp3" "open_h.mp3"

# 2. Slow to 0.50x and fade the tail so it does not hang.
ffmpeg -y -i "open_h.mp3" -filter:a "atempo=0.5,afade=t=out:st=0.46:d=0.22" "ba_final.mp3"
```

The approved reference files still live in temp:

- `%TEMP%\kv_ba_choices_20260825_131555\ba_open_h.mp3` (the open-`a` source trim)
- `%TEMP%\kv_ba_slow_20260825_132106\ba_slow_0.50.mp3` (0.50x slow, no fade)
- `%TEMP%\kv_ba_fade_20260825_132548\ba_fade_0.22.mp3` (approved final)

If the fade window needs tuning later, `st` is "start fade" in seconds and `d`
is fade length. On the 0.50x `ba`, a 0.22s tail starting at 0.46s sounded right.

## Files to regenerate

These are the ones the user flagged as wrong. Each needs a carrier word whose
first syllable is the target. For the `a` row prefer a carrier where the second
syllable starts with `/h/` (keeps the vowel open), or a vowel/glide onset; avoid
`/p/`/`/k/` closures for these "open" targets unless no word works.

Standard (no `_e-*` suffix):

```text
ba  co  da  do  ga  hi  la  ma  no  pa  sa  to  va  ya  za
```

`e` variants (both pepet and taling):

```text
he  me  ne  te  we  ye  ze   (x2 files each: _e-pepet, _e-taling)
```

## Delete the `x` row entirely

There is no `x` suku kata in the app. Remove these files:

```text
public/audio/syllables/KV/KV_xa.mp3
public/audio/syllables/KV/KV_xe_e-pepet.mp3
public/audio/syllables/KV/KV_xe_e-taling.mp3
public/audio/syllables/KV/KV_xi.mp3
public/audio/syllables/KV/KV_xo.mp3
public/audio/syllables/KV/KV_xu.mp3
```

Then drop `x` from the onset lists:

- `src/data/syllablePack.js` -> `PACK_ONSETS = [..."bcdfghjklmnpqrstvwxyz"];` -> remove `x`
- `scripts/lib/syllable-table.mjs` -> `ONSETS = [..."bcdfghjklmnpqrstvwxyz"];` -> remove `x`

And remove all `x*` rows from `public/audio/syllables/manifest.csv`.

## Tooling already in the repo

- `scripts/probe-kv-tts.mjs` - fetch one-off TTS renders for A/B testing.
  `node scripts/probe-kv-tts.mjs --out <dir> "label=chinese_text@ms"`
- `scripts/lib/google-tts.mjs` - TTS fetch + MP3 duration parse (no config, no keys).
- `scripts/lib/trim_first_syllable.py` - **new**; cuts a carrier word's first syllable.
  `python scripts/lib/trim_first_syllable.py --relaxed in.mp3 out.mp3`
  Also accepts `--debug`. Plain mode assumes a voiceless-stop second onset;
  `--relaxed` accepts shallow pockets so `/h/`, vowel, and glide onsets cut too.
- `scripts/qa/kv-syllable-audio-qa.py` - objective check (formants, onset noise, DTW).
  `python scripts/qa/kv-syllable-audio-qa.py table "<glob>"`
- `scripts/regen-kv-tts.mjs` - the older bare-CV generator. **Do not reuse as-is**;
  it produces the bare-string problem. Rewrite it to take a carrier word per entry.

## How to regenerate

1. Build a carrier-word map for the 29 flagged files (standard + `e` variants).
   For each target pick a Malay word where syllable 1 == target, ideally with a
   `/h/` or vowel/glide second onset for the "open" rows.
2. Fetch each carrier word with `probe-kv-tts.mjs` or the `google-tts.mjs` lib
   (`tl=ms`), then trim with `trim_first_syllable.py --relaxed`.
3. Slow to `atempo=0.5` and fade `afade=t=out:st=0.46:d=0.22`.
4. Verify with the QA script that the result is short (<= ~0.5s after slow) and
   has the right F1/F2 for the intended vowel.
5. Write output to `public/audio/syllables/KV/<file>`, update `manifest.csv`
   rows (set `query_text` to the carrier word and `status` to a new label like
   `open-ms`), delete the `x` files, remove `x` from the code + manifest.
6. Commit and push.

## Reference acoustics (current bad files)

The shipped bare-CV files are all ~840-1200ms. The trimmed `ba` from `bahan` is
~280ms before slow, and the 0.50x final is ~630ms. Use duration as a quick
sanity check: a bare-CV file that is still ~1s means the trim/recipe was wrong.
