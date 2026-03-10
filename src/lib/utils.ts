import { clsx, type ClassValue } from "clsx";
import { PieceType } from "shared/concentric-rules";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function genId() {
  return crypto.randomUUID();
}
function getNumCols(row: number): number {
  row = row >= 7 ? 13 - row : row;
  return 1 + (2 * (row - 1));
}

const LETTERS = "abcdefghijkl";

export function toNotation(id: string): string {
  const row = parseInt(id.match(/r(\d+)/)?.[1] || "0", 10);
  const col = parseInt(id.match(/c(\d+)/)?.[1] || "0", 10);

  const numCols = getNumCols(row);
  const centerCol = Math.ceil(numCols / 2);
  if (col == centerCol) {
    return `${LETTERS[12 - row]}1`;
  }
  if (col < centerCol) {
    return `${LETTERS[12 - col]}${row - col + 1}`;
  }
  return `${LETTERS[12 - row]}${12 - row + 1 - (numCols - col)}`
}

export function pieceLabel(piece: PieceType): string {
  switch (piece) {
    case "pawn":
      return "P";
    case "knight":
      return "N";
    case "bishop":
      return "B";
    case "rook":
      return "R";
    case "queen":
      return "Q";
    case "king":
      return "K";
    case "prince":
      return "D";
    default:
      return "";
  }
}
