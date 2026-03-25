import { GameVariant, Move } from "./schema";
import {
  CONCENTRIC_GRAPH,
  RulesPiece,
  CellId,
  Side,
  PieceType,
  BoardGraph,
  ARCHIMEDEAN_GRAPH,
} from "./graph";

export function startingTime(variant: GameVariant): number | null {
  switch (variant) {
    case "concentric-unlimited":
      return null;
    case "concentric-rapid":
      return 10 * 60 * 1000;
    case "concentric-blitz":
      return 3 * 60 * 1000;
    case "concentric-bullet":
      return 1 * 60 * 1000;
    case "archimedean-unlimited":
      return null;
    case "archimedean-rapid":
      return 10 * 60 * 1000;
    case "archimedean-blitz":
      return 3 * 60 * 1000;
    case "archimedean-bullet":
      return 1 * 60 * 1000;
    default:
      throw new Error("Invalid game variant");
  }
}

type Piece = {
  type: PieceType;
  color: Side;
  position: CellId;
  bishopColorChangeUsed: boolean;
  hasMoved: boolean;
};

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
];
const initialPiecesWithIds: Piece[] = initialPieces.map((piece) => ({
  ...piece,
  bishopColorChangeUsed: false,
  hasMoved: false,
}));

type BoardState = {
  variant: GameVariant;
  graph: BoardGraph;
  board: Map<CellId, Piece>;
  captured: Piece[];
  enPassantTarget?: [CellId, CellId, Side]; // the cell that can be captured en passant, and the cell that the captured pawn is actually on
};

function copyState(state: BoardState): BoardState {
  return {
    variant: state.variant,
    graph: state.graph,
    board: new Map(
      state.board.entries().map(([cellId, piece]) => [cellId, { ...piece }]),
    ),
    captured: [...state.captured],
    enPassantTarget: state.enPassantTarget,
  };
}

export function updateStateWithMove(
  state: BoardState,
  fromId: CellId,
  toId: CellId,
  promotion?: PieceType | null,
): BoardState {
  const piece = state.board.get(fromId);
  if (!piece) {
    throw new Error(`Invalid move: no piece at ${fromId}`);
  }
  const toPiece = state.board.get(toId);
  if (toPiece && toPiece.color === piece.color) {
    throw new Error(`Invalid move: cannot capture own piece at ${toId}`);
  }

  // first, we check if this was an en passant capture
  if (
    state.enPassantTarget &&
    toId === state.enPassantTarget[0] &&
    piece.type === "pawn" &&
    piece.color !== state.enPassantTarget[2]
  ) {
    // in this case, we need to remove the captured pawn from the board and add it to the captured array
    const capturedPawn = state.board.get(state.enPassantTarget[1]);
    if (capturedPawn) {
      state.board.delete(state.enPassantTarget[1]);
      state.captured.push(capturedPawn);
    }
  }
  // then we reset the en passant target, since it is only valid for the move immediately following the pawn's move
  state.enPassantTarget = undefined;
  // next, if the piece is a pawn and it moves two squares, we set the en passant target
  if (piece.type === "pawn") {
    const from = parseCellId(fromId);
    const to = parseCellId(toId);
    if (Math.abs(to.row - from.row) === 2) {
      // to find the enpassant square, we need to find the edgeNext entry used to move from the from square to the to square
      const adjacentCells: CellId[] = state.graph.edgeNbrs[fromId];
      for (const cellId of adjacentCells) {
        const paths = state.graph.edgeNext[cellId];
        if (paths && paths[fromId] === toId) {
          // we have a path from -> cellId -> to, so cellId is the en passant target
          state.enPassantTarget = [cellId, toId, piece.color];
          console.log(
            `Setting en passant target to ${cellId} for pawn at ${fromId} moving to ${toId}`,
          );
          break;
        }
      }
    }
  } else if (piece.type === "bishop") {
    // if the piece is a bishop, we need to check if it changes color
    if (
      state.graph.color[fromId].startsWith("light") !==
      state.graph.color[toId].startsWith("light")
    ) {
      piece.bishopColorChangeUsed = true;
    }
  }
  // finally, we move the piece
  if (toPiece) {
    state.captured.push(toPiece);
  }
  state.board.delete(fromId);
  piece.hasMoved = true;
  piece.position = toId;
  if (promotion) {
    piece.type = promotion;
  }
  state.board.set(toId, piece);
  return state;
}

export function getState(variant: GameVariant, moves: Move[]): BoardState {
  const board = new Map<CellId, Piece>();
  const captured: Piece[] = [];
  for (const piece of initialPiecesWithIds) {
    // we want to do a deepcopy here to ensure that we don't accidentally mutate the initial pieces when applying moves
    board.set(piece.position, { ...piece });
  }
  const state = {
    variant,
    graph: variant.startsWith("concentric")
      ? CONCENTRIC_GRAPH
      : ARCHIMEDEAN_GRAPH,
    board,
    captured,
  };
  for (const move of moves) {
    updateStateWithMove(
      state,
      move.fromSquare,
      move.toSquare,
      move.promotion as PieceType,
    );
  }
  return state;
}

function parseCellId(cellId: CellId): { row: number; col: number } {
  const match = cellId.match(/^r(\d+)c(\d+)$/);
  if (!match) {
    throw new Error(`Invalid cell ID: ${cellId}`);
  }
  return { row: parseInt(match[1], 10), col: parseInt(match[2], 10) };
}

function getNumCols(row: number): number {
  row = row >= 7 ? 13 - row : row;
  return 1 + 2 * (row - 1);
}

function ray(
  state: BoardState,
  previous: CellId,
  current: CellId,
  color: Side,
  nextMap: Record<CellId, Partial<Record<CellId, CellId | null>>>,
  capturing: boolean = true,
): CellId[] {
  const moves: CellId[] = [];
  let p = previous;
  let c = current;
  const visited = new Set<string>();

  while (true) {
    const guard = `${p}->${c}`;
    if (visited.has(guard)) {
      break;
    }
    visited.add(guard);
    const occ = state.board.get(c);
    if (occ && occ.color === color) {
      break;
    }
    if (capturing && occ && occ.color !== color) {
      moves.push(c);
      break;
    }
    if (c !== previous) {
      moves.push(c);
    }

    const next = nextMap[c as CellId]?.[p as CellId];
    if (!next) {
      break;
    }
    p = c;
    c = next;
  }

  return moves;
}
// is this cell threatened for the given side? i.e. can any piece of the opposite color move to this cell on their next turn?
function isThreatenedFor(
  state: BoardState,
  cellId: CellId,
  side: Side,
): boolean {
  for (const piece of state.board.values()) {
    if (piece.color !== side) {
      const moves = getLegalMovesFromState(state, piece.position, true);
      if (moves.includes(cellId)) {
        return true;
      }
    }
  }
  return false;
}

function boardStateToString(state: BoardState): string {
  // we can represent the board state as a string by concatenating the piece type and color for each cell, in a consistent order
  const cells = Array.from(state.board.keys()).sort();
  const parts = cells.map((cellId) => {
    const piece = state.board.get(cellId);
    if (!piece) {
      return `${cellId}:empty`;
    }
    return `${cellId}:${piece.type}-${piece.color}`;
  });
  return parts.join("|");
}

export function getPromotionOptionsForMove(
  type: PieceType,
  side: Side,
  to: CellId,
): PieceType[] {
  const { row } = parseCellId(to);
  // if white pawn or prince reaches row 10 or black pawn or prince reaches row 3 it can promote to queen, rook, bishop, or knight
  if (
    ((side === "wht" && row >= 10) || (side === "blk" && row <= 3)) &&
    (type === "pawn" || type === "prince")
  ) {
    return ["queen", "rook", "bishop", "knight"];
  }
  return [];
}

export function getBoardStatus(
  variant: GameVariant,
  moves: Move[],
  side: Side,
): "ongoing" | "check" | "checkmate" | "stalemate" | "draw" {
  const state = getState(variant, moves);
  return getBoardStatusFromState(state, moves, side);
}

export function getBoardStatusFromState(
  state: BoardState,
  moves: Move[],
  side: Side,
): "ongoing" | "check" | "checkmate" | "stalemate" | "draw" {
  // first, we find the king of the given side
  const king = state.board
    .values()
    .find((piece) => piece.type === "king" && piece.color === side)!.position;
  // then, we check if the king is threatened
  if (isThreatenedFor(state, king, side)) {
    // if the king is threatened, we check if there are any legal moves for the given side
    for (const piece of state.board.values()) {
      if (piece.color === side) {
        const moves = getLegalMovesFromState(state, piece.position);
        for (const move of moves) {
          const newState = copyState(state);
          updateStateWithMove(newState, piece.position, move);
          const newKing = piece.type === "king" ? move : king;
          if (!isThreatenedFor(newState, newKing, side)) {
            // if there is a move that can get the king out of check, then it's just check, not checkmate
            return "check";
          }
        }
      }
    }
    // if there are no moves that can get the king out of check, then it's checkmate
    return "checkmate";
  }

  // to check for stalemate and draw, we need:
  // - compute all previous board states to check for threefold repetition (draw)
  // - check if there have been 50 moves without a pawn move or capture (draw)
  // - check for insufficient material, this side only has a king, king and bishop, king and knight, or king and two bishops on same color without color change move (draw)
  // - not in check but has no legal moves (stalemate)

  // first we check no legal moves and insufficient material
  let hasLegalMoves = false;
  const pieceCounts: Record<PieceType, number> = {
    king: 0,
    pawn: 0,
    knight: 0,
    rook: 0,
    queen: 0,
    prince: 0,
    bishop: 0,
  };
  const bishopColors = [];
  const bishopColorChangeUsed = [];
  for (const piece of state.board.values()) {
    if (piece.color !== side) {
      continue;
    }
    pieceCounts[piece.type]++;
    if (piece.type === "bishop") {
      bishopColors.push(state.graph.color[piece.position]);
      bishopColorChangeUsed.push(piece.bishopColorChangeUsed);
    }
    const legalMoves = getLegalMovesFromState(state, piece.position);
    if (legalMoves.length > 0) {
      hasLegalMoves = true;
    }
  }
  if (!hasLegalMoves) {
    return "stalemate";
  }
  if (
    pieceCounts.pawn === 0 &&
    pieceCounts.rook === 0 &&
    pieceCounts.queen === 0 &&
    pieceCounts.prince === 0
  ) {
    if (pieceCounts.knight === 0 && pieceCounts.bishop === 0) {
      // only kings left
      return "draw";
    }
    if (pieceCounts.knight === 1 && pieceCounts.bishop === 0) {
      // king and knight
      return "draw";
    }
    if (pieceCounts.knight === 0 && pieceCounts.bishop === 1) {
      // king and bishop
      return "draw";
    }
    if (pieceCounts.knight === 0 && pieceCounts.bishop === 2) {
      // king and two bishops, draw if they are on the same color and both have used their color changes
      if (
        bishopColors[0] === bishopColors[1] &&
        bishopColorChangeUsed[0] &&
        bishopColorChangeUsed[1]
      ) {
        return "draw";
      }
    }
  }
  // now we use the moves array to compute previous board states for threefold repetition and 50 move rule
  const board = new Map<CellId, Piece>();
  const captured: Piece[] = [];
  let lastCaptureOrPawnMoveIndex = 0;
  const states = new Map<string, number>();
  for (const piece of initialPiecesWithIds) {
    // we want to do a deepcopy here to ensure that we don't accidentally mutate the initial pieces when applying moves
    board.set(piece.position, { ...piece });
  }
  const moveState = {
    variant: state.variant,
    graph: state.graph,
    board,
    captured,
  };
  for (const move of moves) {
    const str = boardStateToString(moveState);
    const count = (states.get(str) || 0) + 1;
    if (count >= 3) {
      return "draw";
    }
    states.set(str, count);
    if (move.moveNumber - lastCaptureOrPawnMoveIndex >= 50) {
      return "draw";
    }
    const capturedLengthBefore = moveState.captured.length;
    const piece = moveState.board.get(move.fromSquare);
    updateStateWithMove(
      moveState,
      move.fromSquare,
      move.toSquare,
      move.promotion as PieceType,
    );
    const capturedLengthAfter = moveState.captured.length;
    if (capturedLengthAfter > capturedLengthBefore || piece?.type === "pawn") {
      lastCaptureOrPawnMoveIndex = move.moveNumber;
    }
  }

  return "ongoing";
}

export function getLegalMoves(
  variant: GameVariant,
  moves: Move[],
  cellId: CellId,
): CellId[] {
  const state = getState(variant, moves);
  return getLegalMovesFromState(state, cellId);
}

export function getLegalMovesFromState(
  state: BoardState,
  cellId: CellId,
  ignoreCheck: boolean = false,
): CellId[] {
  const piece = state.board.get(cellId);
  if (!piece) {
    return [];
  }
  let legalMoves;
  switch (piece.type) {
    case "pawn":
      legalMoves = getPawnMoves(state, piece);
      break;
    case "rook":
      legalMoves = getRookMoves(state, piece);
      break;
    case "bishop":
      legalMoves = getBishopMoves(state, piece);
      break;
    case "knight":
      legalMoves = getKnightMoves(state, piece);
      break;
    case "queen":
      legalMoves = getQueenMoves(state, piece);
      break;
    case "king":
      legalMoves = getKingMoves(state, piece, ignoreCheck);
      break;
    case "prince":
      legalMoves = getPrinceMoves(state, piece);
      break;
    default:
      return [];
  }
  const set = new Set<CellId>(legalMoves);
  if (set.has(cellId)) {
    set.delete(cellId);
  }
  const uniqueMoves = Array.from(set);
  if (ignoreCheck) {
    return uniqueMoves;
  }
  const noCheckMoves = [];
  const king = state.board
    .values()
    .find((p) => p.type === "king" && p.color === piece.color)!.position;
  for (const move of uniqueMoves) {
    const newState = copyState(state);
    updateStateWithMove(newState, piece.position, move);
    const newKing = piece.type === "king" ? move : king;
    if (!isThreatenedFor(newState, newKing, piece.color)) {
      // we only want moves that will not result in the king being in check
      noCheckMoves.push(move);
    }
  }
  return noCheckMoves;
}

function isForwardMove(current: CellId, side: Side, target: CellId): boolean {
  const { row: currentRow } = parseCellId(current);
  const { row: targetRow } = parseCellId(target);
  if (side === "wht") {
    return targetRow > currentRow;
  } else {
    return targetRow < currentRow;
  }
}

function filterForwardMoves(
  current: CellId,
  side: Side,
  moves: CellId[],
): CellId[] {
  const { row: currentRow } = parseCellId(current);
  return moves.filter((move) => {
    const { row: moveRow } = parseCellId(move);
    if (side === "wht") {
      return moveRow > currentRow;
    } else {
      return moveRow < currentRow;
    }
  });
}

function getPawnMoves(state: BoardState, piece: Piece): CellId[] {
  const moves: CellId[] = [];
  // first we check if this is a berolina pawn
  const { row: currentRow, col: currentCol } = parseCellId(piece.position);
  const isBerolina = currentCol === Math.ceil(getNumCols(currentRow) / 2);
  // first, we handle pawn forward movement
  const forwardMoves =
    (isBerolina
      ? // berolina is over vertex
        state.graph.vertexNbrs[piece.position]
      : // normal is over edge
        state.graph.edgeNbrs[piece.position]) || [];
  for (const cellId of forwardMoves) {
    if (state.board.has(cellId)) {
      continue;
    }
    // only add moves if the target cell is empty
    moves.push(cellId);
    if (!piece.hasMoved) {
      // if the piece hasn't moved, we can move through cellId from piece.position to another cell
      const next = isBerolina
        ? state.graph.vertexNext?.[cellId as CellId]?.[piece.position as CellId]
        : state.graph.edgeNext?.[cellId as CellId]?.[piece.position as CellId];
      if (next && !state.board.has(next)) {
        // if next exists and is empty, we can also move there
        moves.push(next);
      }
    }
  }
  // next, we handle captures
  const captureMoves = (
    (isBerolina
      ? // berolina captures diagonally over edges
        state.graph.edgeNbrs[piece.position]
      : // normal captures diagonally over vertices
        state.graph.vertexNbrs[piece.position]) || []
  ).filter((cellId) => {
    if (
      state.enPassantTarget &&
      state.enPassantTarget[0] === cellId &&
      state.enPassantTarget[2] !== piece.color
    ) {
      // in this case we have an en passant capture
      return true;
    }
    const targetPiece = state.board.get(cellId);
    return targetPiece && targetPiece.color !== piece.color;
  });
  moves.push(...captureMoves);

  const filteredMoves = filterForwardMoves(piece.position, piece.color, moves);
  // special archimedean rules for pawns on the innermost and outermost columns
  if (
    state.variant.startsWith("archimedean") &&
    piece.color === "wht" &&
    piece.position === "r6c11"
  ) {
    filteredMoves.push("r6c10");
  } else if (
    state.variant.startsWith("archimedean") &&
    piece.color === "blk" &&
    piece.position === "r7c1"
  ) {
    filteredMoves.push("r7c2");
  }

  if (
    isBerolina &&
    ((piece.color === "wht" && currentRow >= 7) ||
      (piece.color === "blk" && currentRow <= 6))
  ) {
    // if a berolina pawn has reached the last 6 rows, it can capture sideways
    const left = `r${currentRow}c${currentCol - 1}`;
    const right = `r${currentRow}c${currentCol + 1}`;
    if (
      state.board.get(left)?.color === (piece.color === "wht" ? "blk" : "wht")
    ) {
      filteredMoves.push(left);
    }
    if (
      state.board.get(right)?.color === (piece.color === "wht" ? "blk" : "wht")
    ) {
      filteredMoves.push(right);
    }
  }
  return filteredMoves;
}

function getRookMoves(state: BoardState, piece: Piece): CellId[] {
  const moves: CellId[] = [];
  for (const neighbor of state.graph.edgeNbrs[piece.position] || []) {
    moves.push(
      ...ray(
        state,
        piece.position,
        neighbor,
        piece.color,
        state.graph.edgeNext,
      ),
    );
  }
  return moves;
}

function getBishopMoves(state: BoardState, piece: Piece): CellId[] {
  const moves: CellId[] = [];
  for (const neighbor of state.graph.vertexNbrs[piece.position] || []) {
    moves.push(
      ...ray(
        state,
        piece.position,
        neighbor,
        piece.color,
        state.graph.vertexNext,
      ),
    );
  }
  if (!piece.bishopColorChangeUsed) {
    const currentLight = state.graph.color[piece.position].startsWith("light");
    for (const neighbor of state.graph.edgeNbrs[piece.position] || []) {
      if (state.graph.color[neighbor].startsWith("light") !== currentLight) {
        const at = state.board.get(neighbor);
        if (!at || at.color !== piece.color) {
          moves.push(neighbor);
        }
      }
    }
    for (const neighbor of state.graph.vertexNbrs[piece.position] || []) {
      if (state.graph.color[neighbor].startsWith("light") !== currentLight) {
        const at = state.board.get(neighbor);
        if (!at || at.color !== piece.color) {
          moves.push(neighbor);
        }
      }
    }
  }

  return moves;
}

function getQueenMoves(state: BoardState, piece: Piece): CellId[] {
  const moves: CellId[] = [];
  for (const neighbor of state.graph.edgeNbrs[piece.position] || []) {
    moves.push(
      ...ray(
        state,
        piece.position,
        neighbor,
        piece.color,
        state.graph.edgeNext,
      ),
    );
  }
  for (const neighbor of state.graph.vertexNbrs[piece.position] || []) {
    moves.push(
      ...ray(
        state,
        piece.position,
        neighbor,
        piece.color,
        state.graph.vertexNext,
      ),
    );
  }
  return moves;
}

function getKnightMoves(
  state: BoardState,
  piece: Piece,
  intermediaryNotThreatened: boolean = false,
): CellId[] {
  const moves: CellId[] = [];
  const edgeNeighbors = state.graph.edgeNbrs[piece.position] || [];
  const vertexNeighbors = state.graph.vertexNbrs[piece.position] || [];
  const neighbors = new Set<CellId>([...edgeNeighbors, ...vertexNeighbors]);
  // move across an edge, then a vertex to non-adjacent cell
  for (const edgeNeighbor of edgeNeighbors) {
    for (const nextCell of state.graph.vertexNbrs[edgeNeighbor as CellId] ||
      []) {
      if (neighbors.has(nextCell)) {
        continue;
      }
      const at = state.board.get(nextCell);
      if (!at || at.color !== piece.color) {
        if (
          intermediaryNotThreatened &&
          isThreatenedFor(state, edgeNeighbor, piece.color)
        ) {
          continue;
        }
        moves.push(nextCell);
      }
    }
  }
  // move across a vertex, then an edge to non-adjacent cell
  for (const vertexNeighbor of vertexNeighbors) {
    for (const nextCell of state.graph.edgeNbrs[vertexNeighbor as CellId] ||
      []) {
      if (neighbors.has(nextCell)) {
        continue;
      }
      const at = state.board.get(nextCell);
      if (!at || at.color !== piece.color) {
        if (
          intermediaryNotThreatened &&
          isThreatenedFor(state, vertexNeighbor, piece.color)
        ) {
          continue;
        }
        moves.push(nextCell);
      }
    }
  }
  return moves;
}

function getKingMoves(
  state: BoardState,
  piece: Piece,
  ignoreCheck: boolean,
): CellId[] {
  const moves: CellId[] = [];
  for (const neighbor of state.graph.edgeNbrs[piece.position] || []) {
    const at = state.board.get(neighbor);
    if (!at || at.color !== piece.color) {
      moves.push(neighbor);
    }
    // check for king's leap
    if (
      !piece.hasMoved &&
      (ignoreCheck || !isThreatenedFor(state, neighbor, piece.color))
    ) {
      // the king has not moved and the intermediary cell is not threatened, so it can leap over to the next cell
      const next =
        state.graph.edgeNext?.[neighbor as CellId]?.[piece.position as CellId];
      if (next) {
        const atNext = state.board.get(next);
        if (!atNext || atNext.color !== piece.color) {
          moves.push(next);
        }
      }
    }
  }
  for (const neighbor of state.graph.vertexNbrs[piece.position] || []) {
    const at = state.board.get(neighbor);
    if (!at || at.color !== piece.color) {
      moves.push(neighbor);
    }
    // check for king's leap
    if (
      !piece.hasMoved &&
      (ignoreCheck || !isThreatenedFor(state, neighbor, piece.color))
    ) {
      // the king has not moved and the intermediary cell is not threatened, so it can leap over to the next cell
      const next =
        state.graph.vertexNext?.[neighbor as CellId]?.[
          piece.position as CellId
        ];
      if (next) {
        const atNext = state.board.get(next);
        if (!atNext || atNext.color !== piece.color) {
          moves.push(next);
        }
      }
    }
  }

  // if not moved, can also leap like a knight
  if (!piece.hasMoved) {
    moves.push(...getKnightMoves(state, piece, !ignoreCheck));
  }
  return moves;
}

function getPrinceMoves(state: BoardState, piece: Piece): CellId[] {
  const moves: CellId[] = [];
  for (const neighbor of state.graph.edgeNbrs[piece.position] || []) {
    const at = state.board.get(neighbor);
    if (!at || at.color !== piece.color) {
      moves.push(neighbor);
    }
    if (
      !at &&
      !piece.hasMoved &&
      isForwardMove(piece.position, piece.color, neighbor)
    ) {
      // we check for prince's double move, like a pawn's but also across vertices
      const next =
        state.graph.edgeNext?.[neighbor as CellId]?.[piece.position as CellId];
      if (next) {
        const atNext = state.board.get(next);
        if (!atNext || atNext.color !== piece.color) {
          moves.push(next);
        }
      }
    }
  }
  for (const neighbor of state.graph.vertexNbrs[piece.position] || []) {
    const at = state.board.get(neighbor);
    if (!at || at.color !== piece.color) {
      moves.push(neighbor);
    }
    if (
      !at &&
      !piece.hasMoved &&
      isForwardMove(piece.position, piece.color, neighbor)
    ) {
      // we check for prince's double move, like a pawn's but also across vertices
      const next =
        state.graph.vertexNext?.[neighbor as CellId]?.[
          piece.position as CellId
        ];
      if (next) {
        const atNext = state.board.get(next);
        if (!atNext || atNext.color !== piece.color) {
          moves.push(next);
        }
      }
    }
  }
  return moves;
}
