# Copy-paste this into the new Codex chat

```
Continue this task in C:\Users\User\Documents\Pemulihan LearningApp.

Read docs/HANDOFF_IMAGE_EXTRACTION.md first for full context.

Task: Extract the high-quality images embedded in
C:\Users\User\Downloads\PdP Pemulihan.pptx and use them as the word
card images in the Perkataan module. The PPTX has one slide per Malay
word up to K30a. Each word slide has syllable texts (e.g. ["ba","ju"]
= baju) and one unique media image (the shared template images appear
on many slides; the word image appears on only that slide).

What to do:
1. Re-extract the PPTX if needed:
   Expand-Archive -LiteralPath 'C:\Users\User\Downloads\PdP Pemulihan.pptx'
   -DestinationPath "$env:TEMP\pptx-extract" -Force
2. Complete scripts/extract-pptx-images.js: parse ppt/slides/slideN.xml
   for <a:t> text, parse ppt/slides/_rels/slideN.xml.rels for media,
   find the media file unique to that slide, join the syllable texts
   into the Malay word, and copy the image to
   public/images/perkataan/{word}.png (overwrite the current Twemoji
   placeholders).
3. Use PNG when available; fall back to SVG only if there is no PNG.
4. Verify: no 0-byte files in public/images/perkataan, spot-check a few
   known words (baju, bola, buku, cili, gigi), and npm run build passes.
5. Commit and push to origin main.

If the embedded-image mapping is ambiguous for any word, use
C:\Users\User\Downloads\PdP Pemulihan\N.png (full-slide exports) and the
vision-fallback skill (kimi-k2.5) to visually identify and crop the word
image. Do not stop to ask permission; make reasonable assumptions and
report what you did.
```
