import type { Puzzle, ShapeType } from './types';

interface Rect {
  r1: number; c1: number; r2: number; c2: number;
}

// mulberry32 — deterministic, good distribution
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function levelConfig(level: number): { rows: number; cols: number; maxArea: number } {
  // Grid grows by 1 every 5 levels, capped at 10×10
  const size = Math.min(5 + Math.floor(level / 5), 10);
  // Pieces get smaller as level increases (more pieces = harder)
  const maxArea = Math.max(4, 10 - Math.floor(level / 3));
  // Cap at 1/3 of grid so we always have multiple pieces
  return { rows: size, cols: size, maxArea: Math.min(maxArea, Math.floor(size * size / 3)) };
}

/**
 * Find all valid rectangles with top-left at (r, c) in the grid.
 * Since we scan top-left to bottom-right, every cell above and to the left
 * of (r,c) is already assigned — so TL must be exactly (r,c).
 */
function findRectsFromTL(
  grid: number[][],
  r: number,
  c: number,
  rows: number,
  cols: number,
  maxArea: number,
): Rect[] {
  const rects: Rect[] = [];

  for (let r2 = r; r2 < rows; r2++) {
    // If the leftmost column of this row is blocked, can't go further down
    if (grid[r2][c] !== -1) break;

    for (let c2 = c; c2 < cols; c2++) {
      const area = (r2 - r + 1) * (c2 - c + 1);
      if (area > maxArea) break;

      // Check that the entire column c2 from r to r2 is free
      let colFree = true;
      for (let rr = r; rr <= r2; rr++) {
        if (grid[rr][c2] !== -1) { colFree = false; break; }
      }
      if (!colFree) break; // Wider rects would also fail

      rects.push({ r1: r, c1: c, r2, c2 });
    }
  }

  return rects;
}

export function generatePuzzle(level: number): Puzzle {
  const { rows, cols, maxArea } = levelConfig(level);
  // Deterministic seed per level
  const rng = makeRng(level * 7919 + 1327);
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const regions: Rect[] = [];

  // Greedy top-left scan: at each unassigned cell, pick a random valid rectangle
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== -1) continue;

      let rects = findRectsFromTL(grid, r, c, rows, cols, maxArea);

      // Prefer multi-cell pieces (area ≥ 2) when possible
      const bigRects = rects.filter(
        rect => (rect.r2 - rect.r1 + 1) * (rect.c2 - rect.c1 + 1) >= 2,
      );
      if (bigRects.length > 0) rects = bigRects;

      // Fallback: forced 1×1
      const rect = rects.length > 0
        ? rects[Math.floor(rng() * rects.length)]
        : { r1: r, c1: c, r2: r, c2: c };

      const colorIdx = regions.length;
      for (let rr = rect.r1; rr <= rect.r2; rr++)
        for (let cc = rect.c1; cc <= rect.c2; cc++)
          grid[rr][cc] = colorIdx;

      regions.push(rect);
    }
  }

  // Place the seed at any random cell within the rectangle.
  const seeds = regions.map((rect, idx) => {
    const cells: { r: number; c: number }[] = [];
    for (let r = rect.r1; r <= rect.r2; r++)
      for (let c = rect.c1; c <= rect.c2; c++)
        cells.push({ r, c });
    const { r, c } = cells[Math.floor(rng() * cells.length)];
    const h = rect.r2 - rect.r1 + 1;
    const w = rect.c2 - rect.c1 + 1;
    const area = h * w;
    const type: ShapeType = area === 1 ? 'square' : h === w ? 'square' : h > w ? 'tall' : 'wide';
    return { r, c, color: idx, size: area, type };
  });

  return {
    name: `Level ${level + 1}`,
    rows,
    cols,
    seeds,
    solution: grid,
  };
}
