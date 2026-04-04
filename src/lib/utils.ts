import { clsx, type ClassValue } from "clsx";
import { PieceType } from "shared/graph";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function genId() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Cell notation helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

/**
 * Returns a human-readable "time ago" string for a game's last-move timestamp.
 * Returns "-" for null or invalid dates.
 * Returns a locale date string for moves older than one week.
 */
export function formatWhen(lastMoveAt: string | null): string {
  if (!lastMoveAt) return "-";

  const then = new Date(lastMoveAt).getTime();
  if (Number.isNaN(then)) return "-";

  const delta = Date.now() - then;
  if (delta < ONE_WEEK_MS) {
    if (delta < ONE_HOUR_MS) {
      const minutes = Math.max(1, Math.floor(delta / ONE_MINUTE_MS));
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    if (delta < ONE_DAY_MS) {
      const hours = Math.max(1, Math.floor(delta / ONE_HOUR_MS));
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    const days = Math.max(1, Math.floor(delta / ONE_DAY_MS));
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return new Date(lastMoveAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
