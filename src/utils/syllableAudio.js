import { syllableAudioPath } from "../data/syllablePack.js";

const audioCache = new Map();
let activeAudio = null;
let activeCleanup = () => {};
let playbackToken = 0;

function clearActiveAudio() {
  activeCleanup();
  activeCleanup = () => {};

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
}

export function stopSyllableAudio() {
  playbackToken += 1;
  clearActiveAudio();
}

export function playSyllableAudio(item, callbacks = {}) {
  const source = syllableAudioPath(item);
  if (!source || !window.Audio) {
    callbacks.onError?.(new Error("Audio tidak tersedia."));
    return false;
  }

  clearActiveAudio();
  const token = ++playbackToken;

  function begin(audio, allowRetry) {
    let completed = false;
    let started = false;

    const cleanup = () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
    const isCurrent = () => token === playbackToken && activeAudio === audio;
    const finish = (error) => {
      if (completed || !isCurrent()) return;
      completed = true;
      cleanup();
      activeAudio = null;
      activeCleanup = () => {};
      if (error) callbacks.onError?.(error);
      else callbacks.onEnd?.();
    };
    const handlePlaying = () => {
      if (!started && isCurrent()) {
        started = true;
        callbacks.onStart?.();
      }
    };
    const handleEnded = () => finish();
    const handleError = () => {
      if (completed || !isCurrent()) return;
      if (allowRetry) {
        completed = true;
        cleanup();
        audioCache.delete(source);
        const retry = new window.Audio(source);
        retry.preload = "auto";
        audioCache.set(source, retry);
        activeAudio = retry;
        begin(retry, false);
        return;
      }
      finish(new Error(`Audio tidak dapat dimainkan: ${source}`));
    };

    activeAudio = audio;
    activeCleanup = () => {
      completed = true;
      cleanup();
    };
    audio.pause();
    audio.currentTime = 0;
    audio.preload = "auto";
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.play().catch(handleError);
  }

  const audio = audioCache.get(source) || new window.Audio(source);
  audioCache.set(source, audio);
  begin(audio, true);
  return true;
}
