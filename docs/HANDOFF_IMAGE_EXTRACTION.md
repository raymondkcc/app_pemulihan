# Handoff: Extract high-quality word images from PPTX into the app

## Goal
Extract the high-quality embedded images from `PdP Pemulihan.pptx` (one image per perkataan, up to K30a) and use them in the Perkataan module of the learning app.

## Current state
- App: `C:\Users\User\Documents\Pemulihan LearningApp` (Vite + React)
- Word data: `src/data/perkataan.js` -> `PERKATAAN_SKILLS` with `words` arrays per skill
- Word card UI: `src/App.jsx` -> `PerkataanWordCard` renders `<img src={`/images/perkataan/${word}.png`}>` with a fallback icon on error
- Placeholder images already present: `public/images/perkataan/` has 173 Twemoji PNGs (these are temporary placeholders, not the high-quality ones)
- PPTX file: `C:\Users\User\Downloads\PdP Pemulihan.pptx` (~90 MB)
- Slide exports: `C:\Users\User\Downloads\PdP Pemulihan\` contains 190 PNGs named `1.png`..`190.png` (full slides, in case cropping is needed)
- A partial extraction already exists at `%TEMP%\pptx-extract\` (PowerShell expanded the PPTX ZIP); if missing, re-run:
  ```powershell
  Expand-Archive -LiteralPath 'C:\Users\User\Downloads\PdP Pemulihan.pptx' -DestinationPath "$env:TEMP\pptx-extract" -Force
  ```

## What was already discovered
- The PPTX has 190 slides, 336 media files in `ppt/media/`.
- Each word slide contains syllable text pieces (e.g. `["ba","ju"]` for baju, `["bo","la"]` for bola) and a word-specific image.
- Shared template images (decorative header/footer) appear on most slides; the word image is the one whose media file appears on only that slide (frequency 1).
- Example mappings found:
  - slide12 -> texts `ba ju` -> `image49.png` = baju
  - slide13 -> texts `bo la` -> `image51.png` = bola
  - slide14 -> texts `bu ku` -> `image53.png` = buku
  - slide15 -> texts `ci li` -> `image54.png` = cili
  - slide16 -> texts `gi gi` -> `image55.png` = gigi
- Some slides pair `imageX.png` with `imageY.svg` (SVG is the embedded vector duplicate of the same PNG); prefer PNG for app compatibility unless the SVG is clearly the only copy.
- Section/cover slides (e.g. slide1, slide11) have no word image; skip them.

## Next steps (the actual work)
1. Write `scripts/extract-pptx-images.js` (already started as a diagnostic script, needs the full copy/mapping logic).
2. For each slide:
   - Read `ppt/slides/slideN.xml`, extract all `<a:t>` texts, join them to form the Malay word.
   - Read `ppt/slides/_rels/slideN.xml.rels`, collect `Target="../media/..."` media names.
   - Keep only media whose frequency across all slides is 1 (the word image).
   - Prefer `.png`; if the only unique copy is `.svg`, copy that too but consider converting/using PNG.
3. Copy each word image to `public/images/perkataan/{word}.png` (overwrite the Twemoji placeholder).
4. Words from the data not found in slides should keep the Twemoji placeholder or be left empty.
5. Verify:
   - `Get-ChildItem public/images/perkataan | Where Length -eq 0` should return nothing.
   - Check a few known words visually (baju, bola, buku, cili, gigi).
   - `npm run build` must pass.
6. Commit and push to GitHub (`origin main`).

## Notes / useful commands
- Re-download Malay audio files (already done, 218 real MP3s):
  ```powershell
  node scripts/download-tts.js
  ```
- Re-download Twemoji placeholders (already done, 173 PNGs):
  ```powershell
  node scripts/download-images.js
  ```
- Existing scripts in `scripts/`:
  - `download-tts.js`
  - `download-images.js`
  - `extract-pptx-images.js` (diagnostic only; needs completion)
- If cropping full-slide images is required, use the `vision-fallback` skill (kimi-k2.5) to inspect `C:\Users\User\Downloads\PdP Pemulihan\N.png` and determine crop bounds, then crop with PowerShell/System.Drawing or an image library.

## App behavior after images are placed
- No further code change is needed to show images: `PerkataanWordCard` already points at `/images/perkataan/{word}.png`.
- If an image is missing, the card falls back to an icon placeholder.
