let cachedMalayVoice = null;

function preferredMalayVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => /^ms[-_]/i.test(voice.lang)) || null;
}

export function speakMalayText(text, rate = 1) {
  const audio = window.Audio ? new window.Audio(`/audio/perkataan/${text}.mp3`) : null;
  if (audio) {
    audio.playbackRate = rate;
    audio.play().catch(() => speakWithBrowser(text, rate));
    return;
  }
  speakWithBrowser(text, rate);
}

export function speakWithBrowser(text, rate = 1) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;

  const voiceLine = new window.SpeechSynthesisUtterance(text);
  const voice = cachedMalayVoice || preferredMalayVoice();
  cachedMalayVoice = voice;
  if (voice) {
    voiceLine.voice = voice;
    voiceLine.lang = voice.lang;
  } else {
    voiceLine.lang = "ms-MY";
  }
  voiceLine.rate = 0.58 * rate;
  voiceLine.pitch = 1.08;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(voiceLine);
}
