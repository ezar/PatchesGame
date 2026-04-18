const ok = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const haptic = {
  light  : () => ok() && navigator.vibrate(30),
  error  : () => ok() && navigator.vibrate([50, 40, 80]),
  win    : () => ok() && navigator.vibrate([60, 60, 120, 60, 240]),
};
