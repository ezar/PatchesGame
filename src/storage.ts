// Bump version when puzzle generation changes to avoid stale saved grids
const PREFIX = 'patches_v2_';

export function saveLevel(level: number): void {
  localStorage.setItem(`${PREFIX}level`, String(level));
}

export function loadLevel(): number {
  const v = localStorage.getItem(`${PREFIX}level`);
  return v !== null ? parseInt(v, 10) : 0;
}

export function saveGrid(level: number, grid: number[][] | null): void {
  const key = `${PREFIX}grid_${level}`;
  if (grid === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(grid));
  }
}

export function loadGrid(level: number): number[][] | null {
  const raw = localStorage.getItem(`${PREFIX}grid_${level}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as number[][];
  } catch {
    return null;
  }
}
