import type { Grid } from './types';

interface DragStart {
  r: number;
  c: number;
}

interface GameState {
  currentPuzzle: number;
  grid: Grid;
  rows: number;
  cols: number;
  isDragging: boolean;
  dragOrigin: DragStart | null;
  history: Grid[];
  startTime: number;
}

export const state: GameState = {
  currentPuzzle: 0,
  grid: [],
  rows: 0,
  cols: 0,
  isDragging: false,
  dragOrigin: null,
  history: [],
  startTime: 0,
};
