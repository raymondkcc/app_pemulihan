const INTERFACE_CLICK_SOUND = "/audio/quiz/interface-click.mp3";

export function playInterfaceClick() {
  if (!window.Audio) return;

  const audio = new window.Audio(INTERFACE_CLICK_SOUND);
  audio.volume = 0.45;
  audio.play().catch(() => {});
}

export function isInteractiveTarget(target) {
  return target instanceof Element
    ? target.closest("button, a, select, summary, input, textarea, [role='button'], [role='tab'], [role='radio'], [role='checkbox'], [role='switch'], [role='option'], [role='menuitem'], [role='link']")
    : null;
}
