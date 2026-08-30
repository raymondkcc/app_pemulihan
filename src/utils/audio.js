const OPEN_DURATION = 1280;
const NEXT_ROUND_DELAY = 900;
const INTERFACE_CLICK_SOUND = "/audio/quiz/interface-click.mp3";

const syllableAudioCache = new Map();
let activeSyllableAudio = null;
let activeSyllableCleanup = () => {};

function playInterfaceClick() {
  if (!window.Audio) return;

  const audio = new window.Audio(INTERFACE_CLICK_SOUND);
  audio.volume = 0.45;
  audio.play().catch(() => {});
}

function isInteractiveTarget(target) {
  return target instanceof Element
    ? target.closest("button, a, select, summary, input, textarea, [role='button'], [role='tab'], [role='radio'], [role='checkbox'], [role='switch'], [role='option'], [role='menuitem'], [role='link']")
    : null;
}

function stopActiveSyllableAudio() {
  activeSyllableCleanup();
  activeSyllableCleanup = () => {};
  if (activeSyllableAudio) {
    activeSyllableAudio.pause();
    activeSyllableAudio.currentTime = 0;
    activeSyllableAudio = null;
  }
}

function playSyllableAudio(item, callbacks = {}) {
  const source = syllableAudioPath(item);
  if (!source || !window.Audio) {
    callbacks.onError?.(new Error("Audio tidak tersedia."));
    return false;
  }

  const audio = syllableAudioCache.get(source) || new window.Audio(source);
  syllableAudioCache.set(source, audio);
  stopActiveSyllableAudio();

  function startPlayback(nextAudio, canRetry) {
    activeSyllableAudio = nextAudio;
    let finished = false;
    let started = false;

    const cleanup = () => {
      nextAudio.removeEventListener("playing", handlePlaying);
      nextAudio.removeEventListener("ended", handleEnded);
      nextAudio.removeEventListener("error", handleError);
    };
    const finish = (error) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (activeSyllableAudio === nextAudio) activeSyllableAudio = null;
      if (error) callbacks.onError?.(error);
      else callbacks.onEnd?.();
    };
    const handlePlaying = () => {
      if (!started) {
        started = true;
        callbacks.onStart?.();
      }
    };
    const handleEnded = () => finish();
    const handleError = () => {
      if (canRetry && activeSyllableAudio === nextAudio) {
        finished = true;
        cleanup();
        syllableAudioCache.delete(source);
        const retryAudio = new window.Audio(source);
        retryAudio.preload = "auto";
        syllableAudioCache.set(source, retryAudio);
        startPlayback(retryAudio, false);
        return;
      }
      finish(new Error(`Audio tidak dapat dimainkan: ${source}`));
    };

    activeSyllableCleanup = () => {
      finished = true;
      cleanup();
    };
    nextAudio.addEventListener("playing", handlePlaying);
    nextAudio.addEventListener("ended", handleEnded);
    nextAudio.addEventListener("error", handleError);
    nextAudio.play().catch(handleError);
  }

  audio.pause();
  audio.currentTime = 0;
  audio.preload = "auto";
  startPlayback(audio, true);
  return true;
}

