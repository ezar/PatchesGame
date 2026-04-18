export type ShapeType = 'square' | 'tall' | 'wide' | 'free' | 'any';

export interface Seed {
  r: number;
  c: number;
  color: number;
  size: number | null;
  type?: ShapeType;
}

export interface Puzzle {
  name: string;
  cols: number;
  rows: number;
  seeds: Seed[];
  solution?: number[][];
}

export type Grid = number[][]; // -1 = empty, >= 0 = colorIndex
