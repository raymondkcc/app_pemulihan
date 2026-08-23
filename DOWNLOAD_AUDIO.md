Download Malay TTS Audio Files
==============================

Problem: The audio files are empty (0 bytes) because download failed.

To fix on your local machine:

1. Run the Node.js script:
   node scripts/download-tts.js

2. Or use curl for specific words:
   curl -L "https://translate.google.com/translate_tts?ie=UTF-8&q=baju&tl=ms&client=tw-ob" -o public/audio/perkataan/baju.mp3
   curl -L "https://translate.google.com/translate_tts?ie=UTF-8&q=buku&tl=ms&client=tw-ob" -o public/audio/perkataan/buku.mp3

3. Then commit and push:
   git add public/audio/perkataan/
   git commit -m "Add Malay TTS audio files"
   git push origin main
