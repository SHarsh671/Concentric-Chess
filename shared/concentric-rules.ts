// shared/concentric-rules.ts

import { VALID_GRID, isValidCell } from "./concentric-grid";

export type Side = "wht" | "blk";

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "prince"
  | "pawn";

export type CellId = string; // e.g. "r7c4"

export interface RulesPiece {
  type: PieceType;
  color: Side;
  position: CellId;
}

function parseCell(cell: CellId): { r: number; c: number } {
  const rMatch = cell.match(/r(\d+)/);
  const cMatch = cell.match(/c(\d+)/);
  if (!rMatch || !cMatch) {
    throw new Error(`Invalid cell id: ${cell}`);
  }
  return {
    r: parseInt(rMatch[1], 10),
    c: parseInt(cMatch[1], 10),
  };
}

function makeCell(r: number, c: number): CellId {
  return `r${r}c${c}`;
}

function cellOccupied(
  pieces: RulesPiece[],
  r: number,
  c: number
): RulesPiece | undefined {
  if (!isValidCell(r, c)) return undefined;
  const id = makeCell(r, c);
  return pieces.find((p) => p.position === id);
}

/* -------------------------------------------------------
   BASIC MOVE HELPERS
-------------------------------------------------------- */

function addStepIfFreeOrCapture(
  moves: CellId[],
  pieces: RulesPiece[],
  from: { r: number; c: number },
  dr: number,
  dc: number,
  color: Side
) {
  const r = from.r + dr;
  const c = from.c + dc;
  if (!isValidCell(r, c)) return;
  const occ = cellOccupied(pieces, r, c);
  if (!occ || occ.color !== color) {
    moves.push(makeCell(r, c));
  }
}

function rayMoves(
  pieces: RulesPiece[],
  from: { r: number; c: number },
  directions: Array<[number, number]>,
  color: Side
): CellId[] {
  const moves: CellId[] = [];
  for (const [dr, dc] of directions) {
    let r = from.r + dr;
    let c = from.c + dc;
    while (isValidCell(r, c)) {
      const occ = cellOccupied(pieces, r, c);
      const id = makeCell(r, c);
      if (occ) {
        if (occ.color !== color) moves.push(id);
        break;
      } else {
        moves.push(id);
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

/* -------------------------------------------------------
   PIECE MOVE GENERATION (INITIAL VERSION)
   - No check / checkmate
   - No bishop swinging
   - No Berolina mode
-------------------------------------------------------- */

function kingLikeMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side
): CellId[] {
  const { r, c } = parseCell(from);
  const moves: CellId[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      addStepIfFreeOrCapture(moves, pieces, { r, c }, dr, dc, color);
    }
  }
  return moves;
}

function rookMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side
): CellId[] {
  const pos = parseCell(from);
  // Edge neighbours: same row / same column
  const dirs: Array<[number, number]> = [
    [1, 0],  // up the board (towards higher row index)
    [-1, 0], // down the board
    [0, 1],  // right
    [0, -1], // left
  ];
  return rayMoves(pieces, pos, dirs, color);
}

function bishopMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side
): CellId[] {
  const pos = parseCell(from);
  // Vertex neighbours: diagonals
  const dirs: Array<[number, number]> = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  return rayMoves(pieces, pos, dirs, color);
}

function knightMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side
): CellId[] {
  const { r, c } = parseCell(from);
  const moves: CellId[] = [];
  const jumps: Array<[number, number]> = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ];
  for (const [dr, dc] of jumps) {
    const rr = r + dr;
    const cc = c + dc;
    if (!isValidCell(rr, cc)) continue;
    const occ = cellOccupied(pieces, rr, cc);
    if (!occ || occ.color !== color) {
      moves.push(makeCell(rr, cc));
    }
  }
  return moves;
}

function pawnMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side
): CellId[] {
  const { r, c } = parseCell(from);
  const moves: CellId[] = [];

  // white moves r + 1, black moves r - 1.
  const forward = color === "wht" ? 1 : -1;

  // 1-step forward (non-capturing)
  const fr = r + forward;
  if (isValidCell(fr, c) && !cellOccupied(pieces, fr, c)) {
    moves.push(makeCell(fr, c));
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const rr = r + forward;
    const cc = c + dc;
    if (!isValidCell(rr, cc)) continue;
    const occ = cellOccupied(pieces, rr, cc);
    if (occ && occ.color !== color) {
      moves.push(makeCell(rr, cc));
    }
  }

  // (No 2-step first move yet, no Berolina mode yet)
  return moves;
}

/* -------------------------------------------------------
   PUBLIC API
-------------------------------------------------------- */

/**
 * Generate pseudo-legal moves for a single piece on the given board.
 *
 * - Uses only movement rules (no check/checkmate yet).
 * - Uses rNcM grid and VALID_GRID.
 */
export function generatePseudoLegalMovesForPiece(
  piece: RulesPiece,
  allPieces: RulesPiece[]
): CellId[] {
  const { type, color, position } = piece;

  switch (type) {
    case "king":
      return kingLikeMoves(allPieces, position, color);

    case "prince":
      // Initial engine: prince moves like a king
      // (no 2-step forward yet, no special first-move logic)
      return kingLikeMoves(allPieces, position, color);

    case "rook":
      return rookMoves(allPieces, position, color);

    case "bishop":
      return bishopMoves(allPieces, position, color);

    case "queen":
      return [
        ...rookMoves(allPieces, position, color),
        ...bishopMoves(allPieces, position, color),
      ];

    case "knight":
      return knightMoves(allPieces, position, color);

    case "pawn":
      return pawnMoves(allPieces, position, color);

    default:
      return [];
  }
}