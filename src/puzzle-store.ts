/**
 * Shared puzzle cache — imported by both render.ts and engine.ts
 * to avoid a circular dependency between those two modules.
 */
import { generatePuzzle } from './generator';
import type { Puzzle } from './types';

const cache = new Map<number, Puzzle>();

export function getPuzzle(level: number): Puzzle {
  if (!cache.has(level)) {
    cache.set(level, generatePuzzle(level));
  }
  return cache.get(level)!;
}
