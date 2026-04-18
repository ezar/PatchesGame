import { state } from './state';
import {
  loadPuzzle,
  resetPuzzle,
  undoLast,
  checkSolution,
  getHint,
  nextPuzzle,
  closeWin,
  applyRectPreview,
  commitDrag,
  removePatchAt,
} from './engine';

// ── Helpers ──────────────────────────────────────────────────────────────────
function cellFromPoint(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  return el?.closest<HTMLElement>('[data-r]') ?? null;
}

// Track the last cell the preview was applied to — avoids rebuilding the board
// on every pixel of movement when the cursor hasn't crossed into a new cell.
let previewEnd: { r: number; c: number } | null = null;

function startDrag(r: number, c: number): void {
  state.isDragging = true;
  state.dragOrigin = { r, c };
  previewEnd = { r, c };
}

function moveDragTo(r: number, c: number): void {
  // Only re-render when the cursor actually enters a different cell
  if (previewEnd && previewEnd.r === r && previewEnd.c === c) return;
  previewEnd = { r, c };
  applyRectPreview(r, c);
}

// ── Events ───────────────────────────────────────────────────────────────────
export function setupEvents(): void {
  const board = document.getElementById('game-board')!;

  // ── Mouse ──────────────────────────────────────────────────────────────────
  board.addEventListener('mousedown', (e) => {
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    startDrag(+cell.dataset.r!, +cell.dataset.c!);
  });

  // document-level so drag continues outside the board
  document.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    moveDragTo(+cell.dataset.r!, +cell.dataset.c!);
  });

  document.addEventListener('mouseup', () => {
    if (state.isDragging) {
      const isTap = previewEnd && state.dragOrigin &&
        previewEnd.r === state.dragOrigin.r &&
        previewEnd.c === state.dragOrigin.c;
      if (isTap) removePatchAt(state.dragOrigin!.r, state.dragOrigin!.c);
      else commitDrag();
    }
    state.isDragging = false;
    state.dragOrigin = null;
    previewEnd = null;
  });

  // ── Touch ──────────────────────────────────────────────────────────────────
  board.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const cell = cellFromPoint(touch.clientX, touch.clientY);
    if (!cell) return;
    startDrag(+cell.dataset.r!, +cell.dataset.c!);
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!state.isDragging) return;
    const touch = e.touches[0];
    const cell = cellFromPoint(touch.clientX, touch.clientY);
    if (cell) moveDragTo(+cell.dataset.r!, +cell.dataset.c!);
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (state.isDragging) {
      const isTap = previewEnd && state.dragOrigin &&
        previewEnd.r === state.dragOrigin.r &&
        previewEnd.c === state.dragOrigin.c;
      if (isTap) removePatchAt(state.dragOrigin!.r, state.dragOrigin!.c);
      else commitDrag();
    }
    state.isDragging = false;
    state.dragOrigin = null;
    previewEnd = null;
  });

  // ── Buttons ────────────────────────────────────────────────────────────────
  document.getElementById('btn-undo')!.addEventListener('click', undoLast);
  document.getElementById('btn-hint')!.addEventListener('click', getHint);
  document.getElementById('btn-reset')!.addEventListener('click', resetPuzzle);
  document.getElementById('btn-check')!.addEventListener('click', checkSolution);
  document.getElementById('btn-next')!.addEventListener('click', nextPuzzle);
  document.getElementById('btn-close-win')!.addEventListener('click', closeWin);
}

export { loadPuzzle };
