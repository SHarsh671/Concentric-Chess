// shared/concentric-grid.ts

export const VALID_GRID: Record<number, number[]> = {
  1: [1],
  2: [1, 2, 3],
  3: [1, 2, 3, 4, 5],
  4: [1, 2, 3, 4, 5, 6, 7],
  5: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  7: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  8: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  9: [1, 2, 3, 4, 5, 6, 7],
  10: [1, 2, 3, 4, 5],
  11: [1, 2, 3],
  12: [1],
} as const;

export function isValidCell(r: number, c: number): boolean {
  return VALID_GRID[r]?.includes(c) ?? false;
}
