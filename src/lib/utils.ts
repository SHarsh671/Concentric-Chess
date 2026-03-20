import { clsx, type ClassValue } from "clsx";
import { PieceType } from "shared/graph";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function genId() {
  return crypto.randomUUID();
}
function getNumCols(row: number): number {
  row = row >= 7 ? 13 - row : row;
  return 1 + 2 * (row - 1);
}

const LETTERS = "abcdefghijklm";

export function toNotation(
  id: string,
  variant: "concentric" | "archimedean",
): string {
  switch (variant) {
    case "concentric":
      return toNotationConcentric(id);
    case "archimedean":
      return toNotationArchimedean(id);
  }
}

function toNotationConcentric(id: string): string {
  const row = parseInt(id.match(/r(\d+)/)?.[1] || "0", 10);
  const col = parseInt(id.match(/c(\d+)/)?.[1] || "0", 10);

  const numCols = getNumCols(row);
  const centerCol = Math.ceil(numCols / 2);
  if (col == centerCol) {
    return `f${row}`;
  }
  if (col < centerCol) {
    return `${LETTERS[col - 1]}${row}`;
  }
  return `${LETTERS[10 - (numCols - col)]}${row}`;
}

function toNotationArchimedean(id: string): string {
  const row = parseInt(id.match(/r(\d+)/)?.[1] || "0", 10);
  const col = parseInt(id.match(/c(\d+)/)?.[1] || "0", 10);

  const numCols = getNumCols(row);
  const centerCol = Math.ceil(numCols / 2);
  if (col == centerCol) {
    return `g${row}`;
  }
  if (col < centerCol) {
    return `${LETTERS[col - 1 + (row <= 6 ? 1 : 0)]}${row}`;
  }
  return `${LETTERS[10 - (numCols - col) + (row <= 6 ? 2 : 1)]}${row}`;
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
      return "F";
    default:
      return "";
  }
}
