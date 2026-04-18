// First 8 colors: hand-picked, visually distinct on the warm background
export const COLORS: string[] = [
  '#e8622a', // orange
  '#2e7d9e', // teal
  '#c94054', // red/pink
  '#7c5cbf', // purple
  '#2d7a4f', // green
  '#b8943c', // gold
  '#3a5fa0', // blue
  '#9e3d7a', // magenta
];

/**
 * Get the display color for a region index.
 * For idx < 8, returns the hand-picked color.
 * For idx >= 8, generates a visually distinct color using the golden angle.
 */
export function getColor(idx: number): string {
  if (idx < COLORS.length) return COLORS[idx];
  // Golden angle (~137.5°) distributes hues evenly across the spectrum
  const hue = Math.floor((idx * 137.508) % 360);
  const sat = 55 + ((idx * 17) % 16); // 55–70%
  const lit = 38 + ((idx * 11) % 14); // 38–52%
  return `hsl(${hue},${sat}%,${lit}%)`;
}

/**
 * Get the color with alpha for a region index.
 */
export function getColorAlpha(idx: number, alpha: number): string {
  if (idx < COLORS.length) {
    const hex = COLORS[idx];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const hue = Math.floor((idx * 137.508) % 360);
  const sat = 55 + ((idx * 17) % 16);
  const lit = 38 + ((idx * 11) % 14);
  return `hsla(${hue},${sat}%,${lit}%,${alpha})`;
}

// Keep for backward compat with any direct callers
export function hexWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
