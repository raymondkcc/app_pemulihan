# Handoff: audit and fix Perkataan card image framing

State snapshot (2026-08-25): branch `main` at `9f6a238 Zoom out K8 card images`, pushed to origin, clean worktree. 173 PNGs in `public/images/perkataan`, all generated through `scripts/extract-pptx-images.js`. K5, K6 (ini/itu), K7 and K8 have been visually audited and tuned; the remaining skills have not.

## Copy-paste this into the new Codex chat

```
Continue this task in C:\Users\User\Documents\Pemulihan LearningApp.

Read docs/HANDOFF_IMAGE_EXTRACTION.md and docs/HANDOFF_IMAGE_FRAMING.md first for full context.

Task: visually audit and fix the word-card image framing for every skill in the Perkataan > Belajar view. K5, K6, K7 and K8 are already tuned. Audit the rest: K10, K11, K12, K13, K14/K15, K16/K17, K18/K19, K20/K21, K22/K23, K24/K25, K26/K27/K28, K29 Diftong, K29 Vokal berganding, K30(a), K30(b), K30(c).

Hard rules:
- Never hand-edit PNGs in public/images/perkataan. All tuning lives in scripts/extract-pptx-images.js (framingProfiles, mediaOverrides, sourceOverrides). After editing the script, rerun: node scripts/extract-pptx-images.js. It regenerates all 157 PPTX-mapped images deterministically; unmapped words keep their existing files.
- If $env:TEMP\pptx-extract is missing, re-extract:
  Expand-Archive -LiteralPath 'C:\Users\User\Downloads\PdP Pemulihan.pptx' -DestinationPath "$env:TEMP\pptx-extract" -Force
- ffmpeg must be on PATH; the script optimizes every output to a 512x512 transparent-canvas PNG.

How framing works:
- Each image is scaled to fit inside `size` px, then centered on the 512 canvas (optional offsetY nudges it vertically).
- The card viewport is slightly landscape, so tall or diagonal images lose visible top/bottom margin first. Uniform starting point per skill: size 400. Reduce outliers to 350 or 300 (see gam/pen/pin in framingProfiles for precedent). Keep the rest of the skill at one size for consistency.

Per-skill workflow:
1. Start the dev server (npm run dev, serves 127.0.0.1:5173; stop any previous vite process first).
2. Use the in-app browser tools (see the browser skill; if the tab list is empty, open a fresh tab). Navigate: "Jom mula!" -> Bahasa Melayu -> Perkataan -> Belajar. Switch skills via the "Pilih kemahiran" combobox (option labels look like "5. K10").
3. Screenshot the full grid (scroll for later rows). Flag any word whose image is clipped by the card edge, collides with the syllable label, or shows the wrong object. Adjust framingProfiles, rerun extraction, re-screenshot until every image is fully visible with clear margin.
4. If a mapped image is the wrong object, check the extractor's "Ambiguous slides" console output for candidate media files and pick the right one via mediaOverrides (word -> media file name).
5. If the PPTX asset itself is bad or missing, use the full-slide exports in C:\Users\User\Downloads\PdP Pemulihan\N.png plus the vision-fallback skill (kimi-k2.5) to identify and crop a replacement; save it under scripts/assets/perkataan/{word}.png and wire it into sourceOverrides.
6. Words auto-mapped from two candidates that need careful correctness checks: ekor and ubat (K10), tandas (K13), longkang (K22/K23), melancong (K24/K25), bunga and nyamuk (K30a).
7. Words with no unique PPTX image (currently older placeholder or earlier-sourced art): tong, wang, bank; syampu, syiling, Khamis, khemah; stoking, troli, plastik, krayon, aiskrim, brokoli, klip, dram, skuter. Check what they render; if broken or missing, source suitable clean clipart, square it, save to scripts/assets/perkataan, and register in sourceOverrides.

Definition of done, per batch of skills:
- All audited images fully visible with margin in the app at card size, at two zoom levels.
- npm run build passes.
- Integrity check: all 173 PNGs decode via System.Drawing, none 0-byte, none wider/taller than 512.
- git diff --check clean; commit with a message like "Zoom out K10-K13 card images"; push origin main; worktree clean and HEAD matches origin/main.
- Report every assumption made (size choices, replacement sources, override additions).

Do not stop to ask permission; make reasonable assumptions and report what you did.
```

## Tuning history so far (do not regress)

| Words | Profile | Reason |
| --- | --- | --- |
| baju, cili, lima, satu, tiga | size 400, offsetY -12 | push subject up per user |
| bas, cat, jam, jus, kek, rak, kelapa, kereta, kerusi | size 400 | zoom out to show whole image |
| beca | size 480 + custom beca.jpg (white-keyed) | user-supplied trishaw photo |
| kuda, lelaki | size 440 | custom artwork with drawn circle |
| gam | size 350 | glue bottle must read fully |
| pen, pin | size 300 | diagonal tips clipped by landscape viewport |
| ini, itu | custom assets (apple + finger scenes) | restored teaching images |
| api | mediaOverride image93.png | disambiguated slide 31 |

Custom user-supplied art lives in `scripts/assets/perkataan/` and is committed; outputs in `public/` are always regenerable.
