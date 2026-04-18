import { state } from './state';
import { getColor, getColorAlpha } from './colors';
import { getPuzzle } from './puzzle-store';
import type { Puzzle, Seed, ShapeType } from './types';

// ── Shape helpers ────────────────────────────────────────────────────────────
function getSeedShape(seed: Seed, _p: Puzzle): ShapeType {
  return seed.type ?? (seed.size === null ? 'free' : 'square');
}

function buildShapeIcon(shape: ShapeType): HTMLElement {
  const el = document.createElement('div');
  el.className = `seed-shape seed-shape-${shape}`;

  // Cell count per icon shape:  square=2×2=4, tall=1×3=3, wide=3×1=3, free=1×1=1
  const counts: Record<ShapeType, number> = { square: 4, tall: 3, wide: 3, free: 1, any: 1 };
  for (let i = 0; i < counts[shape]; i++) {
    el.appendChild(document.createElement('span'));
  }
  return el;
}

// O(1) cell lookup — rebuilt each time renderBoard() is called.
// Stays valid during a drag (we don't call renderBoard mid-drag anymore).
const cellMap = new Map<string, HTMLElement>();

export function getCell(r: number, c: number): HTMLElement | null {
  return cellMap.get(`${r},${c}`) ?? null;
}

// ── Nav ──────────────────────────────────────────────────────────────────────
export function buildNav(currentLevel: number, onSelect: (level: number) => void): void {
  const nav = document.getElementById('puzzle-nav')!;
  nav.innerHTML = '';

  const WINDOW = 1;
  const start = Math.max(0, currentLevel - WINDOW);
  const end = currentLevel + WINDOW;

  if (currentLevel > 0) {
    const btn = createNavBtn('←', false);
    btn.onclick = () => onSelect(currentLevel - 1);
    nav.appendChild(btn);
  }

  for (let i = start; i <= end; i++) {
    const btn = createNavBtn(String(i + 1), i === currentLevel);
    btn.onclick = () => onSelect(i);
    nav.appendChild(btn);
  }

  const nextBtn = createNavBtn('→', false);
  nextBtn.onclick = () => onSelect(currentLevel + 1);
  nav.appendChild(nextBtn);
}

function createNavBtn(label: string, active: boolean): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'puzzle-btn' + (active ? ' active' : '');
  btn.textContent = label;
  return btn;
}

// ── Full board rebuild (used on load / undo / hint) ──────────────────────────
export function renderBoard(): void {
  const board = document.getElementById('game-board')!;
  const { rows, cols, grid, currentPuzzle } = state;
  const p = getPuzzle(currentPuzzle);

  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  board.style.aspectRatio = `${cols} / ${rows}`;
  board.innerHTML = '';
  cellMap.clear();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);

      const ci = grid[r][c];
      if (ci >= 0) {
        cell.style.background = getColorAlpha(ci, 0.18);
        cell.classList.add('colored');
      }

      const seed = p.seeds.find(s => s.r === r && s.c === c);
      if (seed) {
        const seedEl = document.createElement('div');
        seedEl.className = 'seed';
        const inner = document.createElement('div');
        inner.className = 'seed-inner';
        inner.style.background = getColor(seed.color);

        // Number
        const numEl = document.createElement('span');
        numEl.className = 'seed-num';
        numEl.textContent = seed.size !== null ? String(seed.size) : '?';
        inner.appendChild(numEl);

        // Shape icon (square / tall / wide / free)
        inner.appendChild(buildShapeIcon(getSeedShape(seed, p)));

        seedEl.appendChild(inner);
        cell.appendChild(seedEl);
      }

      cellMap.set(`${r},${c}`, cell);
      board.appendChild(cell);
    }
  }

  drawRegionBorders();
  drawCenterNumbers();
}

// ── Single-cell update (used during drag for incremental updates) ─────────────
export function updateCellFull(r: number, c: number): void {
  const cell = getCell(r, c);
  if (!cell) return;
  const { grid, rows, cols } = state;
  const ci = grid[r][c];

  if (ci >= 0) {
    cell.style.background = getColorAlpha(ci, 0.18);
    cell.classList.add('colored');
    cell.style.borderTop    = r === 0         || grid[r-1][c] !== ci ? `2.5px solid ${getColor(ci)}` : `1px solid ${getColorAlpha(ci, 0.2)}`;
    cell.style.borderBottom = r === rows - 1  || grid[r+1][c] !== ci ? `2.5px solid ${getColor(ci)}` : `1px solid ${getColorAlpha(ci, 0.2)}`;
    cell.style.borderLeft   = c === 0         || grid[r][c-1] !== ci ? `2.5px solid ${getColor(ci)}` : `1px solid ${getColorAlpha(ci, 0.2)}`;
    cell.style.borderRight  = c === cols - 1  || grid[r][c+1] !== ci ? `2.5px solid ${getColor(ci)}` : `1px solid ${getColorAlpha(ci, 0.2)}`;
  } else {
    cell.style.background   = '';
    cell.classList.remove('colored');
    // Clear inline border overrides → CSS default takes over (1px solid #e0d9d0)
    cell.style.borderTop    = '';
    cell.style.borderBottom = '';
    cell.style.borderLeft   = '';
    cell.style.borderRight  = '';
  }
}

export function drawRegionBorders(): void {
  const { rows, cols } = state;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      updateCellFull(r, c);
}

// ── Drag overlay (single positioned div — no per-cell DOM changes during drag) ─
let dragOverlay: HTMLElement | null = null;

export function showDragOverlay(
  r1: number, c1: number, r2: number, c2: number,
  valid: boolean, colorIdx: number,
): void {
  const board = document.getElementById('game-board')!;
  const { rows, cols } = state;

  if (!dragOverlay) {
    dragOverlay = document.createElement('div');
    dragOverlay.className = 'drag-overlay';
    board.appendChild(dragOverlay);
  }

  dragOverlay.style.left   = `${(c1 / cols * 100).toFixed(2)}%`;
  dragOverlay.style.top    = `${(r1 / rows * 100).toFixed(2)}%`;
  dragOverlay.style.width  = `${((c2 - c1 + 1) / cols * 100).toFixed(2)}%`;
  dragOverlay.style.height = `${((r2 - r1 + 1) / rows * 100).toFixed(2)}%`;

  if (valid) {
    dragOverlay.style.background  = getColorAlpha(colorIdx, 0.35);
    dragOverlay.style.borderColor = getColor(colorIdx);
    dragOverlay.classList.remove('inv');
  } else {
    dragOverlay.style.background  = '';
    dragOverlay.style.borderColor = '';
    dragOverlay.classList.add('inv');
  }
}

export function clearDragOverlay(): void {
  dragOverlay?.remove();
  dragOverlay = null;
}

export function drawCenterNumbers(): void {
  document.querySelectorAll('.region-center-num').forEach(el => el.remove());

  const board = document.getElementById('game-board')!;
  const p = getPuzzle(state.currentPuzzle);
  const { rows, cols, grid } = state;

  for (const seed of p.seeds) {
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === seed.color) {
          minR = Math.min(minR, r); maxR = Math.max(maxR, r);
          minC = Math.min(minC, c); maxC = Math.max(maxC, c);
          count++;
        }
      }
    }

    if (count <= 1) continue;

    // Position at the true visual center of the bounding box (in %)
    const leftPct  = ((minC + maxC + 1) / 2 / cols * 100).toFixed(2);
    const topPct   = ((minR + maxR + 1) / 2 / rows * 100).toFixed(2);

    const el = document.createElement('div');
    el.className = 'region-center-num';
    el.textContent = seed.size !== null ? String(seed.size) : '?';
    el.style.left = `${leftPct}%`;
    el.style.top  = `${topPct}%`;
    board.appendChild(el);
  }
}

export function updateCellVisual(r: number, c: number, colorIdx: number, isSeed: boolean): void {
  const cell = getCell(r, c);
  if (!cell) return;
  if (colorIdx >= 0) {
    cell.style.background = getColorAlpha(colorIdx, 0.18);
    cell.classList.add('colored');
  } else if (!isSeed) {
    cell.style.background = '';
    cell.classList.remove('colored');
  }
}

export function flashColorCells(ci: number): void {
  const { rows, cols, grid } = state;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === ci) {
        const cell = getCell(r, c);
        if (cell) {
          cell.classList.remove('hint-flash');
          void cell.offsetWidth;
          cell.classList.add('hint-flash');
        }
      }
    }
  }
}

export function setStatus(msg: string, type: '' | 'error' | 'success' = ''): void {
  const bar = document.getElementById('status-bar')!;
  bar.textContent = msg;
  bar.className = type;
  if (type === 'error') {
    setTimeout(() => {
      bar.textContent = 'Drag to paint regions on the grid';
      bar.className = '';
    }, 3000);
  }
}
