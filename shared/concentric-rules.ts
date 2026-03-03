// shared/concentric-rules.ts
//
// Concentric Circle Chess rules engine (graph-based).
//
// IMPORTANT:
// - This file is imported by BOTH the Next.js frontend and the Cloudflare worker.
// - Do not use DOM APIs here.
// - Do not import UI components here.
//
// Design:
// - Board topology + semantics live in shared/concentric-graph.ts (single source of truth).
// - This file only implements movement rules on top of that graph.

import { CONCENTRIC_GRAPH, CELL_TAGS, CellId as GraphCellId, CellTag } from "./concentric-graph";
import { Move } from "./schema";

export type Side = "wht" | "blk";

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "prince"
  | "pawn";

export type CellId = GraphCellId;

export interface RulesPiece {
  type: PieceType;
  color: Side;
  position: CellId;
}

function pieceAt(pieces: RulesPiece[], cell: CellId): RulesPiece | undefined {
  return pieces.find((p) => p.position === cell);
}

function isEnemy(occ: RulesPiece | undefined, color: Side): boolean {
  return !!occ && occ.color !== color;
}

function hasTag(cell: CellId, tag: CellTag): boolean {
  return CELL_TAGS[cell]?.includes(tag) ?? false;
}

function parseCell(cell: CellId): { r: number; c: number } {
  const m = cell.match(/^r(\d+)c(\d+)$/);
  if (!m) throw new Error(`Invalid cell id: ${cell}`);
  return { r: Number(m[1]), c: Number(m[2]) };
}

/* -------------------------------------------------------
   KING / PRINCE
-------------------------------------------------------- */

function kingStepMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const nbrs = new Set<CellId>([
    ...CONCENTRIC_GRAPH.edgeNbrs[from],
    ...CONCENTRIC_GRAPH.vertexNbrs[from],
  ]);
  const out: CellId[] = [];
  for (const to of nbrs) {
    const occ = pieceAt(pieces, to);
    if (!occ || isEnemy(occ, color)) out.push(to);
  }
  return out;
}

function kingMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  // NOTE: We currently implement the king's 1-step movement.
  // The ruleset includes a special first-move 2-cell option; that can be layered later
  // once we implement check detection and "intermediary cell not threatened" logic.
  return kingStepMoves(pieces, from, color);
}

function princeMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  // Prince moves like a king (not subject to check rules elsewhere).
  return kingStepMoves(pieces, from, color);
}

/* -------------------------------------------------------
   RAY HELPERS (ROOK/BISHOP/QUEEN)
-------------------------------------------------------- */

function rayFrom(
  pieces: RulesPiece[],
  prev: CellId,
  first: CellId,
  color: Side,
  nextMap: Record<CellId, Partial<Record<CellId, CellId | null>>>,
): CellId[] {
  const out: CellId[] = [];
  let p = prev;
  let cur = first;

  while (!out.includes(cur)) {
    const occ = pieceAt(pieces, cur);
    if (!occ) {
      out.push(cur);
    } else {
      if (isEnemy(occ, color)) out.push(cur);
      break;
    }
    const nxt = nextMap[cur]?.[p] ?? null;
    if (!nxt) break;

    // loop guard
    if (nxt === prev) break;

    p = cur;
    cur = nxt;
  }

  return out;
}

function rookMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const out: CellId[] = [];
  for (const first of CONCENTRIC_GRAPH.edgeNbrs[from]) {
    out.push(...rayFrom(pieces, from, first, color, CONCENTRIC_GRAPH.edgeNext));
  }
  return Array.from(new Set(out));
}

function bishopMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const out = new Set<CellId>();

  for (const first of CONCENTRIC_GRAPH.vertexNbrs[from]) {
    const ray = rayFrom(pieces, from, first, color, CONCENTRIC_GRAPH.vertexNext);
    for (const sq of ray) {
      out.add(sq);
    }
  }

  // const isHinge = (cell: CellId) =>
  //   hasTag(cell, "crescent") || hasTag(cell, "halfMoon") || hasTag(cell, "twin");
  //
  // for (const first of CONCENTRIC_GRAPH.vertexNbrs[from]) {
  //   const ray = rayFrom(pieces, from, first, color, CONCENTRIC_GRAPH.vertexNext);
  //   for (const sq of ray) out.add(sq);
  //
  //   // Bishop "swing": if we pass through a hinge cell, allow branching once from that hinge.
  //   // We implement this as: whenever we reach a hinge along a diagonal ray (before being blocked),
  //   // add rays starting in any other diagonal direction from that hinge.
  //   let prev = from;
  //   let cur = first;
  //
  //   while (true) {
  //     const occ = pieceAt(pieces, cur);
  //     const blocked = !!occ;
  //
  //     if (isHinge(cur)) {
  //       for (const altFirst of CONCENTRIC_GRAPH.vertexNbrs[cur]) {
  //         if (altFirst === prev) continue;
  //         const branch = rayFrom(pieces, cur, altFirst, color, CONCENTRIC_GRAPH.vertexNext);
  //         for (const sq of branch) out.add(sq);
  //       }
  //     }
  //
  //     if (blocked) break;
  //     const next = CONCENTRIC_GRAPH.vertexNext[cur]?.[prev] ?? null;
  //     if (!next || next === from) break;
  //     prev = cur;
  //     cur = next;
  //   }
  // }

  return Array.from(out);
}

function queenMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  return Array.from(new Set<CellId>([
    ...rookMoves(pieces, from, color),
    ...bishopMoves(pieces, from, color),
  ]));
}

/* -------------------------------------------------------
   KNIGHT
-------------------------------------------------------- */

// Knight: edge->vertex OR vertex->edge (excluding backtracking).
function knightMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const out = new Set<CellId>();
  const add = (to: CellId) => {
    const occ = pieceAt(pieces, to);
    if (!occ || isEnemy(occ, color)) out.add(to);
  };

  for (const e1 of CONCENTRIC_GRAPH.edgeNbrs[from]) {
    for (const v2 of CONCENTRIC_GRAPH.vertexNbrs[e1]) {
      if (v2 === from) continue;
      add(v2);
    }
  }
  for (const v1 of CONCENTRIC_GRAPH.vertexNbrs[from]) {
    for (const e2 of CONCENTRIC_GRAPH.edgeNbrs[v1]) {
      if (e2 === from) continue;
      add(e2);
    }
  }

  return Array.from(out);
}

/* -------------------------------------------------------
   PAWNS (Berolina on crescents/half-moons)
-------------------------------------------------------- */

function forwardRowDelta(color: Side): number {
  // White starts near r1 and moves toward increasing row index (towards r12).
  return color === "wht" ? +1 : -1;
}

function forwardEdgeTargets(from: CellId, color: Side): CellId[] {
  const { r: r0 } = parseCell(from);
  const dr = forwardRowDelta(color);
  return CONCENTRIC_GRAPH.edgeNbrs[from].filter((to) => parseCell(to).r === r0 + dr);
}

function forwardVertexTargets(from: CellId, color: Side): CellId[] {
  const { r: r0 } = parseCell(from);
  const dr = forwardRowDelta(color);
  return CONCENTRIC_GRAPH.vertexNbrs[from].filter((to) => parseCell(to).r === r0 + dr);
}

function pawnMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const out: CellId[] = [];

  const berolina = hasTag(from, "crescent") || hasTag(from, "halfMoon");

  // Normal pawn: forward=edge, capture=vertex
  // Berolina pawn: forward=vertex, capture=edge
  const forward = berolina ? forwardVertexTargets(from, color) : forwardEdgeTargets(from, color);
  const captures = berolina ? forwardEdgeTargets(from, color) : forwardVertexTargets(from, color);

  // Forward (non-capture)
  for (const to of forward) {
    if (!pieceAt(pieces, to)) out.push(to);
  }

  // 2-step initial move (kept consistent with current debug start rows)
  const { r } = parseCell(from);
  const startRow = color === "wht" ? 4 : 9;
  if (r === startRow) {
    for (const step1 of forward) {
      if (pieceAt(pieces, step1)) continue;
      const step2s = berolina ? forwardVertexTargets(step1, color) : forwardEdgeTargets(step1, color);
      for (const step2 of step2s) {
        if (!pieceAt(pieces, step2)) out.push(step2);
      }
    }
  }

  // Captures
  for (const to of captures) {
    const occ = pieceAt(pieces, to);
    if (occ && isEnemy(occ, color)) out.push(to);
  }

  return Array.from(new Set(out));
}

/* -------------------------------------------------------
   PUBLIC API
-------------------------------------------------------- */

export function generatePseudoLegalMovesForPiece(
  piece: RulesPiece,
  allPieces: RulesPiece[],
): CellId[] {
  const { type, color, position } = piece;

  switch (type) {
    case "king":
      return kingMoves(allPieces, position, color);
    case "prince":
      return princeMoves(allPieces, position, color);
    case "queen":
      return queenMoves(allPieces, position, color);
    case "rook":
      return rookMoves(allPieces, position, color);
    case "bishop":
      return bishopMoves(allPieces, position, color);
    case "knight":
      return knightMoves(allPieces, position, color);
    case "pawn":
      return pawnMoves(allPieces, position, color);
    default:
      return [];
  }
}

export const initialPieces: RulesPiece[] = [
  // White pieces
  { type: "rook", color: "wht", position: "r1c1" },
  { type: "queen", color: "wht", position: "r2c1" },
  { type: "rook", color: "wht", position: "r2c2" },
  { type: "king", color: "wht", position: "r2c3" },
  { type: "knight", color: "wht", position: "r3c1" },
  { type: "bishop", color: "wht", position: "r3c2" },
  { type: "prince", color: "wht", position: "r3c3" },
  { type: "bishop", color: "wht", position: "r3c4" },
  { type: "knight", color: "wht", position: "r3c5" },
  { type: "pawn", color: "wht", position: "r4c1" },
  { type: "pawn", color: "wht", position: "r4c2" },
  { type: "pawn", color: "wht", position: "r4c3" },
  { type: "pawn", color: "wht", position: "r4c4" },
  { type: "pawn", color: "wht", position: "r4c5" },
  { type: "pawn", color: "wht", position: "r4c6" },
  { type: "pawn", color: "wht", position: "r4c7" },

  // Black pieces
  { type: "rook", color: "blk", position: "r12c1" },
  { type: "queen", color: "blk", position: "r11c1" },
  { type: "rook", color: "blk", position: "r11c2" },
  { type: "king", color: "blk", position: "r11c3" },
  { type: "knight", color: "blk", position: "r10c1" },
  { type: "bishop", color: "blk", position: "r10c2" },
  { type: "prince", color: "blk", position: "r10c3" },
  { type: "bishop", color: "blk", position: "r10c4" },
  { type: "knight", color: "blk", position: "r10c5" },
  { type: "pawn", color: "blk", position: "r9c1" },
  { type: "pawn", color: "blk", position: "r9c2" },
  { type: "pawn", color: "blk", position: "r9c3" },
  { type: "pawn", color: "blk", position: "r9c4" },
  { type: "pawn", color: "blk", position: "r9c5" },
  { type: "pawn", color: "blk", position: "r9c6" },
  { type: "pawn", color: "blk", position: "r9c7" },

  //fill board
  // { type: "queen", color: "blk", position: "r5c1"},
  // { type: "queen", color: "blk", position: "r5c2"},
  // { type: "queen", color: "blk", position: "r5c3"},
  // { type: "queen", color: "blk", position: "r5c4"},
  // { type: "queen", color: "blk", position: "r5c5"},
  // { type: "queen", color: "blk", position: "r5c6"},
  // { type: "queen", color: "blk", position: "r5c7"},
  // { type: "queen", color: "blk", position: "r5c8"},
  // { type: "queen", color: "blk", position: "r5c9"},

  // { type: "queen", color: "blk", position: "r6c1"},
  // { type: "queen", color: "blk", position: "r6c2"},
  // { type: "queen", color: "blk", position: "r6c3"},
  // { type: "queen", color: "blk", position: "r6c4"},
  // { type: "queen", color: "blk", position: "r6c5"},
  // { type: "knight", color: "blk", position: "r6c6"},
  // { type: "queen", color: "blk", position: "r6c7"},
  // { type: "queen", color: "blk", position: "r6c8"},
  // { type: "queen", color: "blk", position: "r6c9"},
  // { type: "queen", color: "blk", position: "r6c10"},
  // { type: "queen", color: "blk", position: "r6c11"},

  // { type: "queen", color: "blk", position: "r7c1"},
  // { type: "queen", color: "blk", position: "r7c2"},
  // { type: "queen", color: "blk", position: "r7c3"},
  // { type: "queen", color: "blk", position: "r7c4"},
  // { type: "queen", color: "blk", position: "r7c5"},
  // { type: "knight", color: "blk", position: "r7c6"},
  // { type: "queen", color: "blk", position: "r7c7"},
  // { type: "queen", color: "blk", position: "r7c8"},
  // { type: "queen", color: "blk", position: "r7c9"},
  // { type: "queen", color: "blk", position: "r7c10"},
  // { type: "queen", color: "blk", position: "r7c11"},

  // { type: "queen", color: "blk", position: "r8c1"},
  // { type: "queen", color: "blk", position: "r8c2"},
  // { type: "queen", color: "blk", position: "r8c3"},
  // { type: "queen", color: "blk", position: "r8c4"},
  // { type: "queen", color: "blk", position: "r8c5"},
  // { type: "queen", color: "blk", position: "r8c6"},
  // { type: "queen", color: "blk", position: "r8c7"},
  // { type: "queen", color: "blk", position: "r8c8"},
  // { type: "queen", color: "blk", position: "r8c9"},
];

export function computePieceState(moves: Move[]): RulesPiece[] {
  // deep copy
  const pieces: RulesPiece[] = initialPieces.map((p) => ({ ...p }));

  for (const move of moves) {
    const from = move.fromSquare as CellId;
    const to = move.toSquare as CellId;

    const piece = pieces.find((p) => p.position === from);
    if (!piece) continue;

    // capture
    const capturedIndex = pieces.findIndex((p) => p.position === to);
    if (capturedIndex !== -1) {
      pieces.splice(capturedIndex, 1);
    }

    // move
    piece.position = to;

    // promotion
    if (move.promotion) {
      piece.type = move.promotion as PieceType;
    }
  }

  return pieces;
}
