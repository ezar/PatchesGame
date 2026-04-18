import confetti from 'canvas-confetti';
import { state } from './state';
import { getPuzzle } from './puzzle-store';
import { saveLevel, saveGrid, loadGrid } from './storage';
import {
  renderBoard,
  drawRegionBorders,
  drawCenterNumbers,
  showDragOverlay,
  clearDragOverlay,
  flashColorCells,
  setStatus,
  buildNav,
  getCell,
} from './render';
import { startTimer, stopTimer, getElapsedStr } from './timer';
import { haptic } from './haptic';
import { markPlayed } from './notifications';
import { shareResult } from './share';

export { getPuzzle };

// ── Win effects ───────────────────────────────────────────────────────────────
function playWinSound(): void {
  try {
    const ctx = new AudioContext();
    // Rising arpeggio: C4 E4 G4 C5
    const notes = [261.6, 329.6, 392.0, 523.3];
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch { /* AudioContext not available */ }
}

function launchConfetti(): void {
  const colors = ['#e8622a', '#2e7d9e', '#c94054', '#7c5cbf', '#2d7a4f', '#b8943c'];
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.55 }, colors });
  setTimeout(() => confetti({ particleCount: 50, spread: 90, origin: { y: 0.4 }, colors }), 250);
}

// ── Load ─────────────────────────────────────────────────────────────────────
export function loadPuzzle(idx: number): void {
  state.currentPuzzle = idx;
  const p = getPuzzle(idx);
  state.rows = p.rows;
  state.cols = p.cols;
  state.history = [];
  state.startTime = Date.now();
  state.hintsUsed = 0;
  state.isDragging = false;
  state.dragOrigin = null;

  // Start from empty grid with seeds placed
  state.grid = Array.from({ length: p.rows }, () => Array(p.cols).fill(-1));
  p.seeds.forEach(s => { state.grid[s.r][s.c] = s.color; });

  // Restore saved progress for this level (if any)
  const saved = loadGrid(idx);
  if (saved && saved.length === p.rows && saved[0]?.length === p.cols) {
    state.grid = saved;
    // Always ensure seeds are at their correct color after restore
    p.seeds.forEach(s => { state.grid[s.r][s.c] = s.color; });
  }

  document.getElementById('puzzle-name')!.textContent = p.name;
  document.getElementById('puzzle-num')!.textContent = `${p.rows}×${p.cols}`;
  document.getElementById('win-overlay')!.classList.remove('show');

  saveLevel(idx);
  buildNav(idx, loadPuzzle);
  setStatus('Drag to paint regions on the grid');
  renderBoard();
  startTimer(state.startTime);
}

export function resetPuzzle(): void {
  saveGrid(state.currentPuzzle, null); // clear saved progress
  loadPuzzle(state.currentPuzzle);
}

/** Pending rect from the last valid applyRectPreview call. */
let pendingRect: { r1: number; c1: number; r2: number; c2: number; colorIdx: number } | null = null;

/** Called on mouseup/touchend — commits whatever pendingRect was last previewed. */
export function commitDrag(): void {
  clearDragOverlay();
  if (!pendingRect) return;

  const { r1, c1, r2, c2, colorIdx } = pendingRect;
  pendingRect = null;

  const p = getPuzzle(state.currentPuzzle);
  const { rows, cols } = state;

  // Shape type validation
  const seed = p.seeds.find(s => s.color === colorIdx)!;
  const h = r2 - r1 + 1;
  const w = c2 - c1 + 1;
  const area = h * w;
  if (seed.size !== null && area !== seed.size) {
    setStatus(`❌ Must be ${seed.size} cells (currently ${area})`, 'error');
    return;
  }
  if (seed.type === 'square' && h !== w) {
    haptic.error(); setStatus('❌ Must be a square', 'error'); return;
  }
  if (seed.type === 'tall' && h <= w) {
    haptic.error(); setStatus('❌ Must be taller than wide', 'error'); return;
  }
  if (seed.type === 'wide' && w <= h) {
    haptic.error(); setStatus('❌ Must be wider than tall', 'error'); return;
  }

  saveHistory();

  // Clear existing region for this color (non-seed cells)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (state.grid[r][c] === colorIdx && !p.seeds.some(s => s.r === r && s.c === c))
        state.grid[r][c] = -1;

  // Paint the committed rect (skip cells belonging to a different seed)
  for (let r = r1; r <= r2; r++)
    for (let c = c1; c <= c2; c++) {
      const occupant = p.seeds.find(s => s.r === r && s.c === c);
      if (!occupant || occupant.color === colorIdx)
        state.grid[r][c] = colorIdx;
    }

  haptic.light();
  drawRegionBorders();
  saveGrid(state.currentPuzzle, state.grid);
  drawCenterNumbers();
  autoCheck();
}

/** Tap on a painted cell — removes that entire region (keeps seed dot). */
export function removePatchAt(r: number, c: number): void {
  const colorIdx = state.grid[r][c];
  if (colorIdx < 0) return;

  const p = getPuzzle(state.currentPuzzle);
  saveHistory();

  for (let row = 0; row < state.rows; row++)
    for (let col = 0; col < state.cols; col++)
      if (state.grid[row][col] === colorIdx)
        state.grid[row][col] = -1;

  // Restore the seed dot
  const seed = p.seeds.find(s => s.color === colorIdx)!;
  state.grid[seed.r][seed.c] = colorIdx;

  drawRegionBorders();
  saveGrid(state.currentPuzzle, state.grid);
  drawCenterNumbers();
}

// ── Painting ─────────────────────────────────────────────────────────────────
export function pickNearestSeedColor(r: number, c: number): number {
  const p = getPuzzle(state.currentPuzzle);
  let best = p.seeds[0];
  let bestDist = Infinity;
  p.seeds.forEach(s => {
    const d = Math.abs(s.r - r) + Math.abs(s.c - c);
    if (d < bestDist) { bestDist = d; best = s; }
  });
  return best.color;
}

export function saveHistory(): void {
  state.history.push(state.grid.map(row => [...row]));
  if (state.history.length > 50) state.history.shift();
}

export function paintCell(r: number, c: number, colorIdx: number): void {
  const p = getPuzzle(state.currentPuzzle);
  const seed = p.seeds.find(s => s.r === r && s.c === c);
  if (seed && colorIdx !== seed.color && colorIdx !== -1) return;
  if (state.grid[r][c] === colorIdx) return;

  state.grid[r][c] = colorIdx;
  drawRegionBorders();
  drawRegionBorders();
}

/**
 * Apply an elastic rectangle preview from dragOrigin to (endR, endC).
 *
 * Instead of a full renderBoard() rebuild, this diffs the old grid vs the
 * new one and calls updateCellFull() only on cells that changed (plus their
 * immediate neighbours, which need their border recalculated).
 * This keeps the drag completely smooth — no DOM teardown/rebuild per frame.
 */
export function applyRectPreview(endR: number, endC: number): void {
  const { dragOrigin } = state;
  if (!dragOrigin) return;

  const p = getPuzzle(state.currentPuzzle);

  const r1 = Math.min(dragOrigin.r, endR);
  const r2 = Math.max(dragOrigin.r, endR);
  const c1 = Math.min(dragOrigin.c, endC);
  const c2 = Math.max(dragOrigin.c, endC);

  const seedsInRect = p.seeds.filter(s => s.r >= r1 && s.r <= r2 && s.c >= c1 && s.c <= c2);
  const valid = seedsInRect.length === 1;

  pendingRect = valid
    ? { r1, c1, r2, c2, colorIdx: seedsInRect[0].color }
    : null;

  showDragOverlay(r1, c1, r2, c2, valid, valid ? seedsInRect[0].color : 0);
}

// ── Undo ─────────────────────────────────────────────────────────────────────
export function undoLast(): void {
  if (state.history.length === 0) {
    setStatus('Nothing to undo');
    return;
  }
  state.grid = state.history.pop()!;
  renderBoard();
  setStatus('Undone');
}

// ── Check ────────────────────────────────────────────────────────────────────

/** Returns null if solved, or an error description if not. Silent — no DOM side effects. */
function validateSolution(): string | null {
  const p = getPuzzle(state.currentPuzzle);
  const { rows, cols, grid } = state;

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] < 0) return 'empty';

  const colorCells: Record<number, Array<{ r: number; c: number }>> = {};
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ci = grid[r][c];
      if (!colorCells[ci]) colorCells[ci] = [];
      colorCells[ci].push({ r, c });
    }
  }

  for (const [ciStr, cells] of Object.entries(colorCells)) {
    const ci = Number(ciStr);
    const minR = Math.min(...cells.map(cell => cell.r));
    const maxR = Math.max(...cells.map(cell => cell.r));
    const minC = Math.min(...cells.map(cell => cell.c));
    const maxC = Math.max(...cells.map(cell => cell.c));
    if (cells.length !== (maxR - minR + 1) * (maxC - minC + 1)) return `not-rect:${ci}`;
    const seed = p.seeds.find(s => s.color === ci);
    if (seed && seed.size !== null && cells.length !== seed.size) return `wrong-size:${ci}`;
  }

  return null;
}

function triggerWin(): void {
  stopTimer();
  const p  = getPuzzle(state.currentPuzzle);
  const timeStr = getElapsedStr(state.startTime);
  document.getElementById('win-sub')!.textContent = `Solved in ${timeStr} · ${p.name}`;
  document.getElementById('win-overlay')!.classList.add('show');
  playWinSound();
  launchConfetti();
  haptic.win();
  markPlayed();

  // Wire share button with current result
  const btnShare = document.getElementById('btn-share');
  if (btnShare) {
    btnShare.onclick = () => shareResult(state.currentPuzzle, timeStr, state.hintsUsed);
  }
}

export { shareResult };

export function checkSolution(): void {
  const err = validateSolution();
  if (!err) { triggerWin(); return; }

  haptic.error();
  if (err === 'empty') { setStatus('❌ Some cells are still empty', 'error'); return; }
  const [type, ciStr] = err.split(':');
  const ci = Number(ciStr);
  flashColorCells(ci);
  if (type === 'not-rect') setStatus('❌ That region is not a rectangle', 'error');
  else setStatus(`❌ Region size doesn't match the number`, 'error');
}

/** Called silently after each commitDrag — no error messages shown. */
function autoCheck(): void {
  if (validateSolution() === null) triggerWin();
}

// ── Hint ─────────────────────────────────────────────────────────────────────
export function getHint(): void {
  const p = getPuzzle(state.currentPuzzle);
  if (!p.solution) {
    setStatus('No hint available for this puzzle');
    return;
  }

  const { rows, cols, grid } = state;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== p.solution[r][c]) {
        saveHistory();
        state.grid[r][c] = p.solution[r][c];
        renderBoard();
        const cell = getCell(r, c);
        if (cell) cell.classList.add('hint-flash');
        state.hintsUsed++;
        setStatus('💡 Hint applied — one cell revealed');
        return;
      }
    }
  }
  setStatus('Looking good! Check your solution.');
}

// ── Navigation ───────────────────────────────────────────────────────────────
export function nextPuzzle(): void {
  loadPuzzle(state.currentPuzzle + 1);
}

export function prevPuzzle(): void {
  if (state.currentPuzzle > 0) loadPuzzle(state.currentPuzzle - 1);
}

export function closeWin(): void {
  document.getElementById('win-overlay')!.classList.remove('show');
}
