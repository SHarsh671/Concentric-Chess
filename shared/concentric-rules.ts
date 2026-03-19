// shared/concentric-rules.ts
//
// Concentric Circle Chess rules engine.

import {
  CONCENTRIC_GRAPH,
  CELL_TAGS,
  CellTag,
  RulesPiece, CellId,
  Side,
  PieceType,
} from "./graph";
import { Move } from "./schema";

type InternalPiece = RulesPiece & {
  _id: string;
  bishopColorChangeUsed: boolean;
};

function pieceAt<T extends { position: CellId }>(
  pieces: T[],
  cell: CellId,
): T | undefined {
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

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function cellColor(cell: CellId): "light" | "dark" | undefined {
  const v = CONCENTRIC_GRAPH.color[cell];
  if (!v) return undefined;
  return v.startsWith("light") ? "light" : "dark";
}

function otherSide(color: Side): Side {
  return color === "wht" ? "blk" : "wht";
}

/* -------------------------------------------------------
   INITIAL POSITION
-------------------------------------------------------- */

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

  // fill board
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
  // { type: "queen", color: "blk", position: "r6c6"},
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
  // { type: "queen", color: "blk", position: "r7c6"},
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

/* -------------------------------------------------------
   INTERNAL STATE / REPLAY
-------------------------------------------------------- */

function initialInternalPieces(): InternalPiece[] {
  return initialPieces.map((p, idx) => ({
    ...p,
    _id: `${p.color}:${p.type}:${idx}`,
    bishopColorChangeUsed: false,
  }));
}

function isAdjacentOppositeColorEdge(from: CellId, to: CellId): boolean {
  return (
    (CONCENTRIC_GRAPH.edgeNbrs[from] ?? []).includes(to) &&
    cellColor(from) !== undefined &&
    cellColor(to) !== undefined &&
    cellColor(from) !== cellColor(to)
  );
}

function forwardRowDelta(color: Side): number {
  return color === "wht" ? +1 : -1;
}

function forwardEdgeTargets(from: CellId, color: Side): CellId[] {
  const { r: r0 } = parseCell(from);
  const dr = forwardRowDelta(color);
  return (CONCENTRIC_GRAPH.edgeNbrs[from] ?? []).filter(
    (to) => parseCell(to).r === r0 + dr,
  );
}

function forwardVertexTargets(from: CellId, color: Side): CellId[] {
  const { r: r0 } = parseCell(from);
  const dr = forwardRowDelta(color);
  return (CONCENTRIC_GRAPH.vertexNbrs[from] ?? []).filter(
    (to) => parseCell(to).r === r0 + dr,
  );
}

function pawnForwardTargets(from: CellId, color: Side): CellId[] {
  const berolina = hasTag(from, "crescent") || hasTag(from, "halfMoon");
  return berolina ? forwardVertexTargets(from, color) : forwardEdgeTargets(from, color);
}

function pawnAttackTargets(from: CellId, color: Side): CellId[] {
  const berolina = hasTag(from, "crescent") || hasTag(from, "halfMoon");
  return berolina ? forwardEdgeTargets(from, color) : forwardVertexTargets(from, color);
}

function promotionRowFor(color: Side): number {
  return color === "wht" ? 10 : 3;
}

function canPromote(piece: RulesPiece, to: CellId): boolean {
  const { r } = parseCell(to);
  return (piece.type === "pawn" || piece.type === "prince") && r === promotionRowFor(piece.color);
}

function validPromotionOptionsForPiece(piece: RulesPiece): PieceType[] {
  if (piece.type === "pawn" || piece.type === "prince") {
    return ["queen", "rook", "bishop", "knight"];
  }
  return [];
}

function normalizePromotionForApply(
  piece: RulesPiece,
  to: CellId,
  requested: string | null | undefined,
): PieceType | null {
  if (!canPromote(piece, to)) return null;
  const allowed = validPromotionOptionsForPiece(piece);
  if (requested && allowed.includes(requested as PieceType)) {
    return requested as PieceType;
  }
  return "queen";
}

function computeInternalState(moves: Move[]): InternalPiece[] {
  const pieces = initialInternalPieces();

  for (let i = 0; i < moves.length; i++) {
    const mv = moves[i];
    const from = mv.fromSquare as CellId;
    const to = mv.toSquare as CellId;

    const mover = pieces.find((p) => p.position === from);
    if (!mover) continue;

    // Detect en passant capture before normal capture application.
    let enPassantCapturedSquare: CellId | null = null;
    if (mover.type === "pawn" && !pieceAt(pieces, to)) {
      const epTargetSquares = pawnAttackTargets(from, mover.color);
      if (epTargetSquares.includes(to)) {
        const prev = i > 0 ? moves[i - 1] : null;
        if (prev) {
          const prevTo = prev.toSquare as CellId;
          const maybeCaptured = pieceAt(pieces, prevTo);
          if (
            maybeCaptured &&
            maybeCaptured.type === "pawn" &&
            maybeCaptured.color !== mover.color
          ) {
            enPassantCapturedSquare = prevTo;
          }
        }
      }
    }

    if (enPassantCapturedSquare) {
      const idx = pieces.findIndex((p) => p.position === enPassantCapturedSquare);
      if (idx >= 0) pieces.splice(idx, 1);
    } else {
      const capturedIdx = pieces.findIndex((p) => p.position === to);
      if (capturedIdx >= 0) pieces.splice(capturedIdx, 1);
    }

    if (
      mover.type === "bishop" &&
      !mover.bishopColorChangeUsed &&
      isAdjacentOppositeColorEdge(from, to)
    ) {
      mover.bishopColorChangeUsed = true;
    }

    mover.position = to;

    const promo = normalizePromotionForApply(mover, to, mv.promotion);
    if (promo) mover.type = promo;
  }

  return pieces;
}

function internalToRulesPieces(pieces: InternalPiece[]): RulesPiece[] {
  return pieces.map(({ _id, bishopColorChangeUsed, ...rest }) => ({ ...rest }));
}

function currentInternalPiece(piece: RulesPiece, moves: Move[]): InternalPiece | undefined {
  const pieces = computeInternalState(moves);
  return pieces.find(
    (p) =>
      p.position === piece.position &&
      p.color === piece.color &&
      p.type === piece.type,
  );
}

/* -------------------------------------------------------
   RAY HELPERS
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
  const visited = new Set<string>();

  while (true) {
    const guard = `${p}->${cur}`;
    if (visited.has(guard)) break;
    visited.add(guard);

    const occ = pieceAt(pieces, cur);
    if (!occ) {
      out.push(cur);
    } else {
      if (isEnemy(occ, color)) out.push(cur);
      break;
    }

    const nxt = nextMap[cur]?.[p] ?? null;
    if (!nxt) break;
    if (nxt === prev) break;

    p = cur;
    cur = nxt;
  }

  return out;
}

/* -------------------------------------------------------
   RAW MOVE GENERATION
-------------------------------------------------------- */

function kingStepMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const nbrs = new Set<CellId>([
    ...(CONCENTRIC_GRAPH.edgeNbrs[from] ?? []),
    ...(CONCENTRIC_GRAPH.vertexNbrs[from] ?? []),
  ]);
  const out: CellId[] = [];
  for (const to of nbrs) {
    const occ = pieceAt(pieces, to);
    if (!occ || isEnemy(occ, color)) out.push(to);
  }
  return out;
}

function kingAttackSquares(from: CellId): CellId[] {
  return uniq([
    ...(CONCENTRIC_GRAPH.edgeNbrs[from] ?? []),
    ...(CONCENTRIC_GRAPH.vertexNbrs[from] ?? []),
  ]);
}

function kingLeapCandidates(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): Array<{ to: CellId; via: CellId }> {
  const out: Array<{ to: CellId; via: CellId }> = [];

  for (const first of CONCENTRIC_GRAPH.edgeNbrs[from] ?? []) {
    const second = CONCENTRIC_GRAPH.edgeNext[first]?.[from] ?? null;
    if (!second) continue;
    const occ = pieceAt(pieces, second);
    if (!occ || isEnemy(occ, color)) out.push({ to: second, via: first });
  }

  for (const first of CONCENTRIC_GRAPH.vertexNbrs[from] ?? []) {
    const second = CONCENTRIC_GRAPH.vertexNext[first]?.[from] ?? null;
    if (!second) continue;
    const occ = pieceAt(pieces, second);
    if (!occ || isEnemy(occ, color)) out.push({ to: second, via: first });
  }

  for (const e1 of CONCENTRIC_GRAPH.edgeNbrs[from] ?? []) {
    for (const v2 of CONCENTRIC_GRAPH.vertexNbrs[e1] ?? []) {
      if (v2 === from) continue;
      const occ = pieceAt(pieces, v2);
      if (!occ || isEnemy(occ, color)) out.push({ to: v2, via: e1 });
    }
  }

  for (const v1 of CONCENTRIC_GRAPH.vertexNbrs[from] ?? []) {
    for (const e2 of CONCENTRIC_GRAPH.edgeNbrs[v1] ?? []) {
      if (e2 === from) continue;
      const occ = pieceAt(pieces, e2);
      if (!occ || isEnemy(occ, color)) out.push({ to: e2, via: v1 });
    }
  }

  return uniq(out.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s));
}

function kingMovesRaw(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const out = new Set<CellId>(kingStepMoves(pieces, from, color));

  const start = initialPieces.find((p) => p.type === "king" && p.color === color)?.position;
  if (start && start === from) {
    for (const cand of kingLeapCandidates(pieces, from, color)) {
      out.add(cand.to);
    }
  }

  return Array.from(out);
}

function princeMovesRaw(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const out = new Set<CellId>(kingStepMoves(pieces, from, color));

  const start = initialPieces.find((p) => p.type === "prince" && p.color === color)?.position;
  if (start && start === from) {
    const one = forwardEdgeTargets(from, color);
    for (const mid of one) {
      if (pieceAt(pieces, mid)) continue;
      const two = forwardEdgeTargets(mid, color);
      for (const to of two) {
        if (!pieceAt(pieces, to)) out.add(to);
      }
    }
  }

  return Array.from(out);
}

function rookMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const out: CellId[] = [];
  for (const first of CONCENTRIC_GRAPH.edgeNbrs[from] ?? []) {
    out.push(...rayFrom(pieces, from, first, color, CONCENTRIC_GRAPH.edgeNext));
  }
  return uniq(out);
}

function bishopMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const out = new Set<CellId>();

  for (const first of CONCENTRIC_GRAPH.vertexNbrs[from] ?? []) {
    const ray = rayFrom(
      pieces,
      from,
      first,
      color,
      CONCENTRIC_GRAPH.vertexNext,
    );
    for (const sq of ray) out.add(sq);
  }

  return Array.from(out);
}

function bishopColorChangeMoves(
  piece: RulesPiece,
  pieces: RulesPiece[],
  moves: Move[],
): CellId[] {
  const internal = currentInternalPiece(piece, moves);
  if (internal?.bishopColorChangeUsed) return [];

  const out: CellId[] = [];
  for (const to of CONCENTRIC_GRAPH.edgeNbrs[piece.position] ?? []) {
    if (cellColor(piece.position) === cellColor(to)) continue;
    const occ = pieceAt(pieces, to);
    if (!occ || isEnemy(occ, piece.color)) out.push(to);
  }
  return out;
}

function queenMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  return uniq([
    ...rookMoves(pieces, from, color),
    ...bishopMoves(pieces, from, color),
  ]);
}

function knightMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const out = new Set<CellId>();
  const add = (to: CellId) => {
    const occ = pieceAt(pieces, to);
    if (!occ || isEnemy(occ, color)) out.add(to);
  };

  for (const e1 of CONCENTRIC_GRAPH.edgeNbrs[from] ?? []) {
    for (const v2 of CONCENTRIC_GRAPH.vertexNbrs[e1] ?? []) {
      if (v2 === from) continue;
      add(v2);
    }
  }
  for (const v1 of CONCENTRIC_GRAPH.vertexNbrs[from] ?? []) {
    for (const e2 of CONCENTRIC_GRAPH.edgeNbrs[v1] ?? []) {
      if (e2 === from) continue;
      add(e2);
    }
  }

  return Array.from(out);
}

function lastMove(moves: Move[]): Move | null {
  return moves.length ? moves[moves.length - 1] : null;
}

function enPassantTargets(
  piece: RulesPiece,
  pieces: RulesPiece[],
  moves: Move[],
): CellId[] {
  const lm = lastMove(moves);
  if (!lm) return [];

  const prevPieces = internalToRulesPieces(computeInternalState(moves.slice(0, -1)));
  const lastFrom = lm.fromSquare as CellId;
  const lastTo = lm.toSquare as CellId;

  const movedBefore = pieceAt(prevPieces, lastFrom);
  const movedAfter = pieceAt(pieces, lastTo);

  if (!movedBefore || !movedAfter) return [];
  if (movedBefore.type !== "pawn" || movedAfter.type !== "pawn") return [];
  if (movedAfter.color === piece.color) return [];

  // Detect whether the last pawn move was a legal 2-step pawn move.
  const oneSteps = pawnForwardTargets(lastFrom, movedBefore.color).filter(
    (sq) => !pieceAt(prevPieces, sq),
  );

  let passedOver: CellId | null = null;
  for (const mid of oneSteps) {
    const twoSteps = pawnForwardTargets(mid, movedBefore.color).filter((sq) => sq === lastTo);
    if (twoSteps.length > 0) {
      passedOver = mid;
      break;
    }
  }

  if (!passedOver) return [];

  const myAttackSquares = pawnAttackTargets(piece.position, piece.color);
  if (!myAttackSquares.includes(passedOver)) return [];

  return [passedOver];
}

function pawnMovesRaw(
  piece: RulesPiece,
  pieces: RulesPiece[],
  moves: Move[],
): CellId[] {
  const from = piece.position;
  const color = piece.color;
  const out: CellId[] = [];

  for (const to of pawnForwardTargets(from, color)) {
    if (!pieceAt(pieces, to)) out.push(to);
  }

  const { r } = parseCell(from);
  const startRow = color === "wht" ? 4 : 9;
  if (r === startRow) {
    for (const mid of pawnForwardTargets(from, color)) {
      if (pieceAt(pieces, mid)) continue;
      for (const to of pawnForwardTargets(mid, color)) {
        if (!pieceAt(pieces, to)) out.push(to);
      }
    }
  }

  for (const to of pawnAttackTargets(from, color)) {
    const occ = pieceAt(pieces, to);
    if (occ && isEnemy(occ, color)) out.push(to);
  }

  out.push(...enPassantTargets(piece, pieces, moves));

  return uniq(out);
}

function generatePseudoLegalMovesRaw(
  piece: RulesPiece,
  allPieces: RulesPiece[],
  moves: Move[] = [],
): CellId[] {
  const { type, color, position } = piece;

  switch (type) {
    case "king":
      return kingMovesRaw(allPieces, position, color);
    case "prince":
      return princeMovesRaw(allPieces, position, color);
    case "queen":
      return queenMoves(allPieces, position, color);
    case "rook":
      return rookMoves(allPieces, position, color);
    case "bishop":
      return uniq([
        ...bishopMoves(allPieces, position, color),
        ...bishopColorChangeMoves(piece, allPieces, moves),
      ]);
    case "knight":
      return knightMoves(allPieces, position, color);
    case "pawn":
      return pawnMovesRaw(piece, allPieces, moves);
    default:
      return [];
  }
}

/* -------------------------------------------------------
   ATTACK GENERATION
-------------------------------------------------------- */

function attackSquaresForPiece(
  piece: RulesPiece,
  pieces: RulesPiece[],
  moves: Move[] = [],
): CellId[] {
  switch (piece.type) {
    case "pawn":
      return pawnAttackTargets(piece.position, piece.color);
    case "king":
      return kingAttackSquares(piece.position);
    case "prince":
      return kingAttackSquares(piece.position);
    case "bishop":
      return uniq([
        ...bishopMoves(pieces, piece.position, piece.color),
        ...bishopColorChangeMoves(piece, pieces, moves),
      ]);
    case "rook":
      return rookMoves(pieces, piece.position, piece.color);
    case "queen":
      return queenMoves(pieces, piece.position, piece.color);
    case "knight":
      return knightMoves(pieces, piece.position, piece.color);
    default:
      return [];
  }
}

function attacksSquare(
  pieces: RulesPiece[],
  attacker: RulesPiece,
  target: CellId,
  moves: Move[] = [],
): boolean {
  return attackSquaresForPiece(attacker, pieces, moves).includes(target);
}

/* -------------------------------------------------------
   CHECK / LEGAL FILTERING
-------------------------------------------------------- */

function kingPosition(pieces: RulesPiece[], color: Side): CellId | null {
  const k = pieces.find((p) => p.type === "king" && p.color === color);
  return k ? k.position : null;
}

export function isKingInCheckConcentric(
  pieces: RulesPiece[],
  color: Side,
  moves: Move[] = [],
): boolean {
  const kp = kingPosition(pieces, color);
  if (!kp) return false;

  for (const p of pieces) {
    if (p.color === color) continue;
    if (attacksSquare(pieces, p, kp, moves)) return true;
  }

  return false;
}

function applyMoveToPieces(
  pieces: RulesPiece[],
  from: CellId,
  to: CellId,
  promotion?: PieceType | null,
  enPassantCapturedSquare?: CellId | null,
): RulesPiece[] {
  const next = pieces.map((p) => ({ ...p }));
  const mover = next.find((p) => p.position === from);
  if (!mover) return next;

  if (enPassantCapturedSquare) {
    const idx = next.findIndex((p) => p.position === enPassantCapturedSquare);
    if (idx >= 0) next.splice(idx, 1);
  } else {
    const idx = next.findIndex((p) => p.position === to);
    if (idx >= 0) next.splice(idx, 1);
  }

  mover.position = to;
  if (promotion) mover.type = promotion;

  return next;
}

function legalMovesForPiece(
  piece: RulesPiece,
  pieces: RulesPiece[],
  moves: Move[] = [],
): CellId[] {
  const pseudo = generatePseudoLegalMovesRaw(piece, pieces, moves);
  const legal: CellId[] = [];

  for (const to of pseudo) {
    let enPassantCapturedSquare: CellId | null = null;
    if (piece.type === "pawn") {
      const epTargets = enPassantTargets(piece, pieces, moves);
      if (epTargets.includes(to)) {
        const lm = lastMove(moves);
        if (lm) enPassantCapturedSquare = lm.toSquare as CellId;
      }
    }

    const promotion = canPromote(piece, to) ? "queen" : null;
    const after = applyMoveToPieces(
      pieces,
      piece.position,
      to,
      promotion,
      enPassantCapturedSquare,
    );

    // Additional king first-move leap legality:
    // intermediary cell may be occupied but must not be threatened.
    if (piece.type === "king") {
      const start = initialPieces.find(
        (p) => p.type === "king" && p.color === piece.color,
      )?.position;

      if (start && start === piece.position) {
        const leap = kingLeapCandidates(pieces, piece.position, piece.color).find(
          (cand) => cand.to === to,
        );
        if (leap) {
          const enemies = pieces.filter((p) => p.color === otherSide(piece.color));
          let viaThreatened = false;
          for (const e of enemies) {
            if (attacksSquare(pieces, e, leap.via, moves)) {
              viaThreatened = true;
              break;
            }
          }
          if (viaThreatened) continue;
        }
      }
    }

    if (!isKingInCheckConcentric(after, piece.color, moves)) {
      legal.push(to);
    }
  }

  return uniq(legal);
}

/* -------------------------------------------------------
   PUBLIC API
-------------------------------------------------------- */

export function generatePseudoLegalMovesForPieceConcentric(
  piece: RulesPiece,
  allPieces: RulesPiece[],
  moves: Move[] = [],
): CellId[] {
  return legalMovesForPiece(piece, allPieces, moves);
}

/* -------------------------------------------------------
   GAME STATUS
-------------------------------------------------------- */

export function sideHasLegalMoveConcentric(
  pieces: RulesPiece[],
  color: Side,
  moves: Move[] = [],
): boolean {
  for (const p of pieces) {
    if (p.color !== color) continue;
    if (legalMovesForPiece(p, pieces, moves).length > 0) return true;
  }
  return false;
}

export function insufficientMaterialConcentric(
  pieces: RulesPiece[],
): boolean {
  const nonKings = pieces.filter((p) => p.type !== "king");

  if (nonKings.length === 0) return true;
  if (nonKings.length === 1 && (nonKings[0].type === "bishop" || nonKings[0].type === "knight")) {
    return true;
  }

  return false;
}

export function gameStatusConcentric(
  pieces: RulesPiece[],
  sideToMove: Side,
  moves: Move[] = [],
): "ongoing" | "check" | "checkmate" | "stalemate" | "draw" {
  if (insufficientMaterialConcentric(pieces)) return "draw";

  const inCheck = isKingInCheckConcentric(pieces, sideToMove, moves);
  const hasLegal = sideHasLegalMoveConcentric(pieces, sideToMove, moves);

  if (inCheck && !hasLegal) return "checkmate";
  if (!inCheck && !hasLegal) return "stalemate";
  if (inCheck) return "check";

  return "ongoing";
}

/* -------------------------------------------------------
   STATE APPLICATION
-------------------------------------------------------- */

export function computePieceStateConcentric(moves: Move[]): RulesPiece[] {
  return internalToRulesPieces(computeInternalState(moves));
}

export function validPromotionOptionsForMoveConcentric(
  piece: RulesPiece,
  to: CellId,
): PieceType[] {
  return canPromote(piece, to) ? validPromotionOptionsForPiece(piece) : [];
}
