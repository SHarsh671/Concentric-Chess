// shared/archimedean-rules.ts
//
// Rules engine for Archimedean Spiral Chess.

import { Move } from "./schema";

/* -------------------------------------------------------
   TYPES
-------------------------------------------------------- */

export type Side = "wht" | "blk";
export type CellId = string;

export type PieceType =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "prince"
  | "pawn";

export interface RulesPiece {
  type: PieceType;
  color: Side;
  position: CellId;
}

/* -------------------------------------------------------
   GRAPH CONTRACT (placeholder for now)
-------------------------------------------------------- */

export type BoardGraph = {
  edgeNbrs: Record<CellId, CellId[]>;
  vertexNbrs: Record<CellId, CellId[]>;
  edgeNext: Record<CellId, Record<CellId, CellId | null>>;
  vertexNext: Record<CellId, Record<CellId, CellId | null>>;
  color: Record<CellId, "light" | "dark">;
};

/**
 * PLACEHOLDER GRAPH
 */
export const ARCHIMEDEAN_GRAPH: BoardGraph =
{
  "color": {
    "r10c1": "light",
    "r10c2": "dark",
    "r10c3": "light",
    "r10c4": "dark",
    "r10c5": "light",
    "r11c1": "dark",
    "r11c2": "light",
    "r11c3": "dark",
    "r12c1": "light",
    "r1c1": "light",
    "r2c1": "dark",
    "r2c2": "light",
    "r2c3": "dark",
    "r3c1": "light",
    "r3c2": "dark",
    "r3c3": "light",
    "r3c4": "dark",
    "r3c5": "light",
    "r4c1": "dark",
    "r4c2": "light",
    "r4c3": "dark",
    "r4c4": "light",
    "r4c5": "dark",
    "r4c6": "light",
    "r4c7": "dark",
    "r5c1": "light",
    "r5c2": "dark",
    "r5c3": "light",
    "r5c4": "dark",
    "r5c5": "light",
    "r5c6": "dark",
    "r5c7": "light",
    "r5c8": "dark",
    "r5c9": "light",
    "r6c1": "dark",
    "r6c10": "light",
    "r6c11": "dark",
    "r6c2": "light",
    "r6c3": "dark",
    "r6c4": "light",
    "r6c5": "dark",
    "r6c6": "light",
    "r6c7": "dark",
    "r6c8": "light",
    "r6c9": "dark",
    "r7c1": "dark",
    "r7c10": "light",
    "r7c11": "dark",
    "r7c2": "light",
    "r7c3": "dark",
    "r7c4": "light",
    "r7c5": "dark",
    "r7c6": "light",
    "r7c7": "dark",
    "r7c8": "light",
    "r7c9": "dark",
    "r8c1": "light",
    "r8c2": "dark",
    "r8c3": "light",
    "r8c4": "dark",
    "r8c5": "light",
    "r8c6": "dark",
    "r8c7": "light",
    "r8c8": "dark",
    "r8c9": "light",
    "r9c1": "dark",
    "r9c2": "light",
    "r9c3": "dark",
    "r9c4": "light",
    "r9c5": "dark",
    "r9c6": "light",
    "r9c7": "dark"
  },
  "edgeNbrs": {
    "r10c1": [
      "r11c1",
      "r9c1",
      "r10c2"
    ],
    "r10c2": [
      "r10c1",
      "r9c2",
      "r10c3",
      "r11c2"
    ],
    "r10c3": [
      "r9c5",
      "r10c2",
      "r9c3",
      "r10c4"
    ],
    "r10c4": [
      "r10c5",
      "r9c6",
      "r10c3",
      "r11c2"
    ],
    "r10c5": [
      "r11c3",
      "r10c4",
      "r9c7"
    ],
    "r11c1": [
      "r11c2",
      "r10c1",
      "r12c1"
    ],
    "r11c2": [
      "r11c1",
      "r11c3",
      "r10c2",
      "r10c4"
    ],
    "r11c3": [
      "r11c2",
      "r12c1",
      "r10c5"
    ],
    "r12c1": [
      "r11c3",
      "r11c1"
    ],
    "r1c1": [
      "r2c3",
      "r2c1"
    ],
    "r2c1": [
      "r2c2",
      "r1c1",
      "r3c1"
    ],
    "r2c2": [
      "r3c2",
      "r2c1",
      "r2c3",
      "r3c4"
    ],
    "r2c3": [
      "r1c1",
      "r2c2",
      "r3c5"
    ],
    "r3c1": [
      "r3c2",
      "r4c1",
      "r2c1"
    ],
    "r3c2": [
      "r4c2",
      "r3c1",
      "r2c2",
      "r3c3"
    ],
    "r3c3": [
      "r3c2",
      "r4c3",
      "r4c5",
      "r3c4"
    ],
    "r3c4": [
      "r2c2",
      "r3c3",
      "r4c6",
      "r3c5"
    ],
    "r3c5": [
      "r4c7",
      "r3c4",
      "r2c3"
    ],
    "r4c1": [
      "r3c1",
      "r4c2",
      "r5c1"
    ],
    "r4c2": [
      "r4c3",
      "r5c2",
      "r4c1",
      "r3c2"
    ],
    "r4c3": [
      "r5c3",
      "r4c4",
      "r3c3",
      "r4c2"
    ],
    "r4c4": [
      "r4c5",
      "r5c6",
      "r4c3",
      "r5c4"
    ],
    "r4c5": [
      "r5c7",
      "r4c4",
      "r4c6",
      "r3c3"
    ],
    "r4c6": [
      "r5c8",
      "r4c5",
      "r3c4",
      "r4c7"
    ],
    "r4c7": [
      "r4c6",
      "r5c9",
      "r3c5"
    ],
    "r5c1": [
      "r5c2",
      "r4c1",
      "r6c1"
    ],
    "r5c2": [
      "r6c2",
      "r5c3",
      "r4c2",
      "r5c1"
    ],
    "r5c3": [
      "r6c3",
      "r4c3",
      "r5c2",
      "r5c4"
    ],
    "r5c4": [
      "r5c3",
      "r5c5",
      "r6c4",
      "r4c4"
    ],
    "r5c5": [
      "r6c5",
      "r5c6",
      "r5c4",
      "r6c7"
    ],
    "r5c6": [
      "r6c8",
      "r5c7",
      "r4c4",
      "r5c5"
    ],
    "r5c7": [
      "r5c6",
      "r6c9",
      "r4c5",
      "r5c8"
    ],
    "r5c8": [
      "r6c10",
      "r5c9",
      "r4c6",
      "r5c7"
    ],
    "r5c9": [
      "r6c11",
      "r5c8",
      "r4c7"
    ],
    "r6c1": [
      "r5c1",
      "r7c2",
      "r6c2"
    ],
    "r6c10": [
      "r7c11",
      "r5c8",
      "r6c9",
      "r6c11"
    ],
    "r6c11": [
      "r5c9",
      "r6c10"
    ],
    "r6c2": [
      "r6c3",
      "r5c2",
      "r6c1",
      "r7c3"
    ],
    "r6c3": [
      "r7c4",
      "r5c3",
      "r6c2",
      "r6c4"
    ],
    "r6c4": [
      "r6c5",
      "r7c5",
      "r5c4",
      "r6c3"
    ],
    "r6c5": [
      "r7c6",
      "r5c5",
      "r6c6",
      "r6c4"
    ],
    "r6c6": [
      "r7c7",
      "r6c7",
      "r6c5"
    ],
    "r6c7": [
      "r6c6",
      "r7c8",
      "r5c5",
      "r6c8"
    ],
    "r6c8": [
      "r6c9",
      "r5c6",
      "r6c7",
      "r7c9"
    ],
    "r6c9": [
      "r5c7",
      "r7c10",
      "r6c8",
      "r6c10"
    ],
    "r7c1": [
      "r7c2",
      "r8c1"
    ],
    "r7c10": [
      "r7c9",
      "r7c11",
      "r6c9",
      "r8c8"
    ],
    "r7c11": [
      "r6c10",
      "r7c10",
      "r8c9"
    ],
    "r7c2": [
      "r7c1",
      "r6c1",
      "r7c3",
      "r8c2"
    ],
    "r7c3": [
      "r8c3",
      "r6c2",
      "r7c2",
      "r7c4"
    ],
    "r7c4": [
      "r7c3",
      "r7c5",
      "r8c4",
      "r6c3"
    ],
    "r7c5": [
      "r6c4",
      "r8c5",
      "r7c4",
      "r7c6"
    ],
    "r7c6": [
      "r7c5",
      "r7c7",
      "r6c5"
    ],
    "r7c7": [
      "r6c6",
      "r7c6",
      "r7c8",
      "r8c5"
    ],
    "r7c8": [
      "r7c9",
      "r8c6",
      "r6c7",
      "r7c7"
    ],
    "r7c9": [
      "r8c7",
      "r6c8",
      "r7c8",
      "r7c10"
    ],
    "r8c1": [
      "r7c1",
      "r8c2",
      "r9c1"
    ],
    "r8c2": [
      "r8c1",
      "r8c3",
      "r7c2",
      "r9c2"
    ],
    "r8c3": [
      "r8c4",
      "r9c3",
      "r7c3",
      "r8c2"
    ],
    "r8c4": [
      "r9c4",
      "r8c3",
      "r8c5",
      "r7c4"
    ],
    "r8c5": [
      "r8c4",
      "r7c7",
      "r7c5",
      "r8c6"
    ],
    "r8c6": [
      "r8c5",
      "r9c4",
      "r7c8",
      "r8c7"
    ],
    "r8c7": [
      "r8c8",
      "r9c5",
      "r8c6",
      "r7c9"
    ],
    "r8c8": [
      "r8c7",
      "r8c9",
      "r7c10",
      "r9c6"
    ],
    "r8c9": [
      "r7c11",
      "r8c8",
      "r9c7"
    ],
    "r9c1": [
      "r9c2",
      "r10c1",
      "r8c1"
    ],
    "r9c2": [
      "r9c3",
      "r10c2",
      "r9c1",
      "r8c2"
    ],
    "r9c3": [
      "r9c4",
      "r10c3",
      "r9c2",
      "r8c3"
    ],
    "r9c4": [
      "r9c3",
      "r8c4",
      "r8c6",
      "r9c5"
    ],
    "r9c5": [
      "r10c3",
      "r9c6",
      "r8c7",
      "r9c4"
    ],
    "r9c6": [
      "r8c8",
      "r9c7",
      "r9c5",
      "r10c4"
    ],
    "r9c7": [
      "r10c5",
      "r8c9",
      "r9c6"
    ]
  },
  "edgeNext": {
    "r10c1": {
      "r11c1": "r9c1",
      "r9c1": "r11c1"
    },
    "r10c2": {
      "r10c1": "r10c3",
      "r10c3": "r10c1",
      "r11c2": "r9c2",
      "r9c2": "r11c2"
    },
    "r10c3": {
      "r10c2": "r10c4",
      "r10c4": "r10c2",
      "r9c3": "r9c5",
      "r9c5": "r9c3"
    },
    "r10c4": {
      "r10c3": "r10c5",
      "r10c5": "r10c3",
      "r11c2": "r9c6",
      "r9c6": "r11c2"
    },
    "r10c5": {
      "r11c3": "r9c7",
      "r9c7": "r11c3"
    },
    "r11c1": {
      "r10c1": "r12c1",
      "r12c1": "r10c1"
    },
    "r11c2": {
      "r10c2": "r10c4",
      "r10c4": "r10c2",
      "r11c1": "r11c3",
      "r11c3": "r11c1"
    },
    "r11c3": {
      "r10c5": "r12c1",
      "r12c1": "r10c5"
    },
    "r12c1": {
      "r11c1": "r11c3",
      "r11c3": "r11c1"
    },
    "r1c1": {
      "r2c1": "r2c3",
      "r2c3": "r2c1"
    },
    "r2c1": {
      "r1c1": "r3c1",
      "r3c1": "r1c1"
    },
    "r2c2": {
      "r2c1": "r2c3",
      "r2c3": "r2c1",
      "r3c2": "r3c4",
      "r3c4": "r3c2"
    },
    "r2c3": {
      "r1c1": "r3c5",
      "r3c5": "r1c1"
    },
    "r3c1": {
      "r2c1": "r4c1",
      "r4c1": "r2c1"
    },
    "r3c2": {
      "r2c2": "r4c2",
      "r3c1": "r3c3",
      "r3c3": "r3c1",
      "r4c2": "r2c2"
    },
    "r3c3": {
      "r3c2": "r3c4",
      "r3c4": "r3c2",
      "r4c3": "r4c5",
      "r4c5": "r4c3"
    },
    "r3c4": {
      "r2c2": "r4c6",
      "r3c3": "r3c5",
      "r3c5": "r3c3",
      "r4c6": "r2c2"
    },
    "r3c5": {
      "r2c3": "r4c7",
      "r4c7": "r2c3"
    },
    "r4c1": {
      "r3c1": "r5c1",
      "r5c1": "r3c1"
    },
    "r4c2": {
      "r3c2": "r5c2",
      "r4c1": "r4c3",
      "r4c3": "r4c1",
      "r5c2": "r3c2"
    },
    "r4c3": {
      "r3c3": "r5c3",
      "r4c2": "r4c4",
      "r4c4": "r4c2",
      "r5c3": "r3c3"
    },
    "r4c4": {
      "r4c3": "r4c5",
      "r4c5": "r4c3",
      "r5c4": "r5c6",
      "r5c6": "r5c4"
    },
    "r4c5": {
      "r3c3": "r5c7",
      "r4c4": "r4c6",
      "r4c6": "r4c4",
      "r5c7": "r3c3"
    },
    "r4c6": {
      "r3c4": "r5c8",
      "r4c5": "r4c7",
      "r4c7": "r4c5",
      "r5c8": "r3c4"
    },
    "r4c7": {
      "r3c5": "r5c9",
      "r5c9": "r3c5"
    },
    "r5c1": {
      "r4c1": "r6c1",
      "r6c1": "r4c1"
    },
    "r5c2": {
      "r4c2": "r6c2",
      "r5c1": "r5c3",
      "r5c3": "r5c1",
      "r6c2": "r4c2"
    },
    "r5c3": {
      "r4c3": "r6c3",
      "r5c2": "r5c4",
      "r5c4": "r5c2",
      "r6c3": "r4c3"
    },
    "r5c4": {
      "r4c4": "r6c4",
      "r5c3": "r5c5",
      "r5c5": "r5c3",
      "r6c4": "r4c4"
    },
    "r5c5": {
      "r5c4": "r5c6",
      "r5c6": "r5c4",
      "r6c5": "r6c7",
      "r6c7": "r6c5"
    },
    "r5c6": {
      "r4c4": "r6c8",
      "r5c5": "r5c7",
      "r5c7": "r5c5",
      "r6c8": "r4c4"
    },
    "r5c7": {
      "r4c5": "r6c9",
      "r5c6": "r5c8",
      "r5c8": "r5c6",
      "r6c9": "r4c5"
    },
    "r5c8": {
      "r4c6": "r6c10",
      "r5c7": "r5c9",
      "r5c9": "r5c7",
      "r6c10": "r4c6"
    },
    "r5c9": {
      "r4c7": "r6c11",
      "r6c11": "r4c7"
    },
    "r6c1": {
      "r5c1": "r7c2",
      "r7c2": "r5c1"
    },
    "r6c10": {
      "r5c8": "r7c11",
      "r6c11": "r6c9",
      "r6c9": "r6c11",
      "r7c11": "r5c8"
    },
    "r6c11": {},
    "r6c2": {
      "r5c2": "r7c3",
      "r6c1": "r6c3",
      "r6c3": "r6c1",
      "r7c3": "r5c2"
    },
    "r6c3": {
      "r5c3": "r7c4",
      "r6c2": "r6c4",
      "r6c4": "r6c2",
      "r7c4": "r5c3"
    },
    "r6c4": {
      "r5c4": "r7c5",
      "r6c3": "r6c5",
      "r6c5": "r6c3",
      "r7c5": "r5c4"
    },
    "r6c5": {
      "r5c5": "r7c6",
      "r6c4": "r6c6",
      "r6c6": "r6c4",
      "r7c6": "r5c5"
    },
    "r6c6": {
      "r6c5": "r6c7",
      "r6c7": "r6c5"
    },
    "r6c7": {
      "r5c5": "r7c8",
      "r6c6": "r6c8",
      "r6c8": "r6c6",
      "r7c8": "r5c5"
    },
    "r6c8": {
      "r5c6": "r7c9",
      "r6c7": "r6c9",
      "r6c9": "r6c7",
      "r7c9": "r5c6"
    },
    "r6c9": {
      "r5c7": "r7c10",
      "r6c10": "r6c8",
      "r6c8": "r6c10",
      "r7c10": "r5c7"
    },
    "r7c1": {},
    "r7c10": {
      "r6c9": "r8c8",
      "r7c11": "r7c9",
      "r7c9": "r7c11",
      "r8c8": "r6c9"
    },
    "r7c11": {
      "r6c10": "r8c9",
      "r8c9": "r6c10"
    },
    "r7c2": {
      "r6c1": "r8c2",
      "r7c1": "r7c3",
      "r7c3": "r7c1",
      "r8c2": "r6c1"
    },
    "r7c3": {
      "r6c2": "r8c3",
      "r7c2": "r7c4",
      "r7c4": "r7c2",
      "r8c3": "r6c2"
    },
    "r7c4": {
      "r6c3": "r8c4",
      "r7c3": "r7c5",
      "r7c5": "r7c3",
      "r8c4": "r6c3"
    },
    "r7c5": {
      "r6c4": "r8c5",
      "r7c4": "r7c6",
      "r7c6": "r7c4",
      "r8c5": "r6c4"
    },
    "r7c6": {
      "r7c5": "r7c7",
      "r7c7": "r7c5"
    },
    "r7c7": {
      "r6c6": "r8c5",
      "r7c6": "r7c8",
      "r7c8": "r7c6",
      "r8c5": "r6c6"
    },
    "r7c8": {
      "r6c7": "r8c6",
      "r7c7": "r7c9",
      "r7c9": "r7c7",
      "r8c6": "r6c7"
    },
    "r7c9": {
      "r6c8": "r8c7",
      "r7c10": "r7c8",
      "r7c8": "r7c10",
      "r8c7": "r6c8"
    },
    "r8c1": {
      "r7c1": "r9c1",
      "r9c1": "r7c1"
    },
    "r8c2": {
      "r7c2": "r9c2",
      "r8c1": "r8c3",
      "r8c3": "r8c1",
      "r9c2": "r7c2"
    },
    "r8c3": {
      "r7c3": "r9c3",
      "r8c2": "r8c4",
      "r8c4": "r8c2",
      "r9c3": "r7c3"
    },
    "r8c4": {
      "r7c4": "r9c4",
      "r8c3": "r8c5",
      "r8c5": "r8c3",
      "r9c4": "r7c4"
    },
    "r8c5": {
      "r7c5": "r7c7",
      "r7c7": "r7c5",
      "r8c4": "r8c6",
      "r8c6": "r8c4"
    },
    "r8c6": {
      "r7c8": "r9c4",
      "r8c5": "r8c7",
      "r8c7": "r8c5",
      "r9c4": "r7c8"
    },
    "r8c7": {
      "r7c9": "r9c5",
      "r8c6": "r8c8",
      "r8c8": "r8c6",
      "r9c5": "r7c9"
    },
    "r8c8": {
      "r7c10": "r9c6",
      "r8c7": "r8c9",
      "r8c9": "r8c7",
      "r9c6": "r7c10"
    },
    "r8c9": {
      "r7c11": "r9c7",
      "r9c7": "r7c11"
    },
    "r9c1": {
      "r10c1": "r8c1",
      "r8c1": "r10c1"
    },
    "r9c2": {
      "r10c2": "r8c2",
      "r8c2": "r10c2",
      "r9c1": "r9c3",
      "r9c3": "r9c1"
    },
    "r9c3": {
      "r10c3": "r8c3",
      "r8c3": "r10c3",
      "r9c2": "r9c4",
      "r9c4": "r9c2"
    },
    "r9c4": {
      "r8c4": "r8c6",
      "r8c6": "r8c4",
      "r9c3": "r9c5",
      "r9c5": "r9c3"
    },
    "r9c5": {
      "r10c3": "r8c7",
      "r8c7": "r10c3",
      "r9c4": "r9c6",
      "r9c6": "r9c4"
    },
    "r9c6": {
      "r10c4": "r8c8",
      "r8c8": "r10c4",
      "r9c5": "r9c7",
      "r9c7": "r9c5"
    },
    "r9c7": {
      "r10c5": "r8c9",
      "r8c9": "r10c5"
    }
  },
  "vertexNbrs": {
    "r10c1": [
      "r9c2",
      "r11c2"
    ],
    "r10c2": [
      "r10c4",
      "r11c1",
      "r9c1",
      "r9c3"
    ],
    "r10c3": [
      "r9c6",
      "r9c2",
      "r9c4",
      "r11c2"
    ],
    "r10c4": [
      "r9c7",
      "r10c2",
      "r11c3",
      "r9c5"
    ],
    "r10c5": [
      "r9c6",
      "r11c2"
    ],
    "r11c1": [
      "r11c3",
      "r10c2"
    ],
    "r11c2": [
      "r12c1",
      "r10c5",
      "r10c3",
      "r10c1"
    ],
    "r11c3": [
      "r11c1",
      "r10c4"
    ],
    "r12c1": [
      "r11c2"
    ],
    "r1c1": [
      "r2c2"
    ],
    "r2c1": [
      "r2c3",
      "r3c2"
    ],
    "r2c2": [
      "r1c1",
      "r3c3",
      "r3c1",
      "r3c5"
    ],
    "r2c3": [
      "r3c4",
      "r2c1"
    ],
    "r3c1": [
      "r4c2",
      "r2c2"
    ],
    "r3c2": [
      "r4c3",
      "r3c4",
      "r2c1",
      "r4c1"
    ],
    "r3c3": [
      "r2c2",
      "r4c2",
      "r4c6",
      "r4c4"
    ],
    "r3c4": [
      "r3c2",
      "r4c5",
      "r2c3",
      "r4c7"
    ],
    "r3c5": [
      "r4c6",
      "r2c2"
    ],
    "r4c1": [
      "r5c2",
      "r3c2"
    ],
    "r4c2": [
      "r5c1",
      "r3c1",
      "r3c3",
      "r5c3"
    ],
    "r4c3": [
      "r4c5",
      "r5c2",
      "r3c2",
      "r5c4"
    ],
    "r4c4": [
      "r5c3",
      "r3c3",
      "r5c7",
      "r5c5"
    ],
    "r4c5": [
      "r4c3",
      "r3c4",
      "r5c8",
      "r5c6"
    ],
    "r4c6": [
      "r3c3",
      "r5c9",
      "r3c5",
      "r5c7"
    ],
    "r4c7": [
      "r3c4",
      "r5c8"
    ],
    "r5c1": [
      "r4c2",
      "r6c2"
    ],
    "r5c2": [
      "r4c1",
      "r6c1",
      "r4c3",
      "r6c3"
    ],
    "r5c3": [
      "r6c2",
      "r4c4",
      "r6c4",
      "r4c2"
    ],
    "r5c4": [
      "r6c3",
      "r6c5",
      "r5c6",
      "r4c3"
    ],
    "r5c5": [
      "r6c8",
      "r6c4",
      "r6c6",
      "r4c4"
    ],
    "r5c6": [
      "r5c4",
      "r4c5",
      "r6c7",
      "r6c9"
    ],
    "r5c7": [
      "r6c8",
      "r4c4",
      "r4c6",
      "r6c10"
    ],
    "r5c8": [
      "r4c7",
      "r6c11",
      "r6c9",
      "r4c5"
    ],
    "r5c9": [
      "r6c10",
      "r4c6"
    ],
    "r6c1": [
      "r7c1",
      "r5c2",
      "r7c3"
    ],
    "r6c10": [
      "r7c10",
      "r5c7",
      "r5c9"
    ],
    "r6c11": [
      "r5c8",
      "r7c11"
    ],
    "r6c2": [
      "r7c2",
      "r7c4",
      "r5c1",
      "r5c3"
    ],
    "r6c3": [
      "r7c3",
      "r7c5",
      "r5c2",
      "r5c4"
    ],
    "r6c4": [
      "r5c3",
      "r7c6",
      "r5c5",
      "r7c4"
    ],
    "r6c5": [
      "r6c7",
      "r7c5",
      "r5c4"
    ],
    "r6c6": [
      "r7c6",
      "r7c8",
      "r5c5"
    ],
    "r6c7": [
      "r5c6",
      "r7c7",
      "r6c5",
      "r7c9"
    ],
    "r6c8": [
      "r7c8",
      "r5c5",
      "r7c10",
      "r5c7"
    ],
    "r6c9": [
      "r5c8",
      "r5c6",
      "r7c11",
      "r7c9"
    ],
    "r7c1": [
      "r8c2",
      "r6c1"
    ],
    "r7c10": [
      "r8c9",
      "r6c8",
      "r8c7",
      "r6c10"
    ],
    "r7c11": [
      "r6c9",
      "r8c8",
      "r6c11"
    ],
    "r7c2": [
      "r6c2",
      "r8c3",
      "r8c1"
    ],
    "r7c3": [
      "r8c2",
      "r6c3",
      "r8c4",
      "r6c1"
    ],
    "r7c4": [
      "r8c5",
      "r8c3",
      "r6c4",
      "r6c2"
    ],
    "r7c5": [
      "r6c3",
      "r8c4",
      "r7c7",
      "r6c5"
    ],
    "r7c6": [
      "r6c6",
      "r8c5",
      "r6c4"
    ],
    "r7c7": [
      "r7c5",
      "r6c7",
      "r8c6"
    ],
    "r7c8": [
      "r6c6",
      "r8c7",
      "r8c5",
      "r6c8"
    ],
    "r7c9": [
      "r6c9",
      "r8c8",
      "r8c6",
      "r6c7"
    ],
    "r8c1": [
      "r7c2",
      "r9c2"
    ],
    "r8c2": [
      "r7c3",
      "r9c1",
      "r7c1",
      "r9c3"
    ],
    "r8c3": [
      "r9c2",
      "r7c2",
      "r9c4",
      "r7c4"
    ],
    "r8c4": [
      "r8c6",
      "r7c5",
      "r9c3",
      "r7c3"
    ],
    "r8c5": [
      "r9c4",
      "r7c8",
      "r7c6",
      "r7c4"
    ],
    "r8c6": [
      "r9c5",
      "r7c9",
      "r7c7",
      "r8c4"
    ],
    "r8c7": [
      "r7c8",
      "r9c4",
      "r7c10",
      "r9c6"
    ],
    "r8c8": [
      "r7c9",
      "r9c5",
      "r9c7",
      "r7c11"
    ],
    "r8c9": [
      "r7c10",
      "r9c6"
    ],
    "r9c1": [
      "r8c2",
      "r10c2"
    ],
    "r9c2": [
      "r10c1",
      "r10c3",
      "r8c3",
      "r8c1"
    ],
    "r9c3": [
      "r8c4",
      "r8c2",
      "r10c2",
      "r9c5"
    ],
    "r9c4": [
      "r8c7",
      "r10c3",
      "r8c3",
      "r8c5"
    ],
    "r9c5": [
      "r10c4",
      "r9c3",
      "r8c6",
      "r8c8"
    ],
    "r9c6": [
      "r8c7",
      "r10c3",
      "r10c5",
      "r8c9"
    ],
    "r9c7": [
      "r10c4",
      "r8c8"
    ]
  },
  "vertexNext": {
    "r10c1": {},
    "r10c2": {
      "r10c4": "r9c1",
      "r11c1": "r9c3",
      "r9c1": "r10c4",
      "r9c3": "r11c1"
    },
    "r10c3": {
      "r11c2": "r9c4",
      "r9c2": "r9c6",
      "r9c4": "r11c2",
      "r9c6": "r9c2"
    },
    "r10c4": {
      "r10c2": "r9c7",
      "r11c3": "r9c5",
      "r9c5": "r11c3",
      "r9c7": "r10c2"
    },
    "r10c5": {},
    "r11c1": {},
    "r11c2": {
      "r10c1": "r10c5",
      "r10c3": "r12c1",
      "r10c5": "r10c1",
      "r12c1": "r10c3"
    },
    "r11c3": {},
    "r12c1": {},
    "r1c1": {},
    "r2c1": {},
    "r2c2": {
      "r1c1": "r3c3",
      "r3c1": "r3c5",
      "r3c3": "r1c1",
      "r3c5": "r3c1"
    },
    "r2c3": {},
    "r3c1": {},
    "r3c2": {
      "r2c1": "r4c3",
      "r3c4": "r4c1",
      "r4c1": "r3c4",
      "r4c3": "r2c1"
    },
    "r3c3": {
      "r2c2": "r4c4",
      "r4c2": "r4c6",
      "r4c4": "r2c2",
      "r4c6": "r4c2"
    },
    "r3c4": {
      "r2c3": "r4c5",
      "r3c2": "r4c7",
      "r4c5": "r2c3",
      "r4c7": "r3c2"
    },
    "r3c5": {},
    "r4c1": {},
    "r4c2": {
      "r3c1": "r5c3",
      "r3c3": "r5c1",
      "r5c1": "r3c3",
      "r5c3": "r3c1"
    },
    "r4c3": {
      "r3c2": "r5c4",
      "r4c5": "r5c2",
      "r5c2": "r4c5",
      "r5c4": "r3c2"
    },
    "r4c4": {
      "r3c3": "r5c5",
      "r5c3": "r5c7",
      "r5c5": "r3c3",
      "r5c7": "r5c3"
    },
    "r4c5": {
      "r3c4": "r5c6",
      "r4c3": "r5c8",
      "r5c6": "r3c4",
      "r5c8": "r4c3"
    },
    "r4c6": {
      "r3c3": "r5c9",
      "r3c5": "r5c7",
      "r5c7": "r3c5",
      "r5c9": "r3c3"
    },
    "r4c7": {},
    "r5c1": {},
    "r5c2": {
      "r4c1": "r6c3",
      "r4c3": "r6c1",
      "r6c1": "r4c3",
      "r6c3": "r4c1"
    },
    "r5c3": {
      "r4c2": "r6c4",
      "r4c4": "r6c2",
      "r6c2": "r4c4",
      "r6c4": "r4c2"
    },
    "r5c4": {
      "r4c3": "r6c5",
      "r5c6": "r6c3",
      "r6c3": "r5c6",
      "r6c5": "r4c3"
    },
    "r5c5": {
      "r4c4": "r6c6",
      "r6c4": "r6c8",
      "r6c6": "r4c4",
      "r6c8": "r6c4"
    },
    "r5c6": {
      "r4c5": "r6c7",
      "r5c4": "r6c9",
      "r6c7": "r4c5",
      "r6c9": "r5c4"
    },
    "r5c7": {
      "r4c4": "r6c10",
      "r4c6": "r6c8",
      "r6c10": "r4c4",
      "r6c8": "r4c6"
    },
    "r5c8": {
      "r4c5": "r6c11",
      "r4c7": "r6c9",
      "r6c11": "r4c5",
      "r6c9": "r4c7"
    },
    "r5c9": {},
    "r6c1": {
      "r5c2": "r7c1",
      "r7c1": "r5c2"
    },
    "r6c10": {
      "r5c9": "r7c10",
      "r7c10": "r5c9"
    },
    "r6c11": {},
    "r6c2": {
      "r5c1": "r7c4",
      "r5c3": "r7c2",
      "r7c2": "r5c3",
      "r7c4": "r5c1"
    },
    "r6c3": {
      "r5c2": "r7c5",
      "r5c4": "r7c3",
      "r7c3": "r5c4",
      "r7c5": "r5c2"
    },
    "r6c4": {
      "r5c3": "r7c6",
      "r5c5": "r7c4",
      "r7c4": "r5c5",
      "r7c6": "r5c3"
    },
    "r6c5": {
      "r6c7": "r7c5",
      "r7c5": "r6c7"
    },
    "r6c6": {
      "r5c5": "r7c6",
      "r7c6": "r5c5"
    },
    "r6c7": {
      "r5c6": "r7c7",
      "r6c5": "r7c9",
      "r7c7": "r5c6",
      "r7c9": "r6c5"
    },
    "r6c8": {
      "r5c5": "r7c10",
      "r5c7": "r7c8",
      "r7c10": "r5c5",
      "r7c8": "r5c7"
    },
    "r6c9": {
      "r5c6": "r7c11",
      "r5c8": "r7c9",
      "r7c11": "r5c6",
      "r7c9": "r5c8"
    },
    "r7c1": {},
    "r7c10": {
      "r6c10": "r8c7",
      "r6c8": "r8c9",
      "r8c7": "r6c10",
      "r8c9": "r6c8"
    },
    "r7c11": {
      "r6c11": "r8c8",
      "r8c8": "r6c11"
    },
    "r7c2": {
      "r6c2": "r8c1",
      "r8c1": "r6c2"
    },
    "r7c3": {
      "r6c1": "r8c4",
      "r6c3": "r8c2",
      "r8c2": "r6c3",
      "r8c4": "r6c1"
    },
    "r7c4": {
      "r6c2": "r8c5",
      "r6c4": "r8c3",
      "r8c3": "r6c4",
      "r8c5": "r6c2"
    },
    "r7c5": {
      "r6c3": "r7c7",
      "r6c5": "r8c4",
      "r7c7": "r6c3",
      "r8c4": "r6c5"
    },
    "r7c6": {
      "r6c6": "r8c5",
      "r8c5": "r6c6"
    },
    "r7c7": {
      "r6c7": "r7c5",
      "r7c5": "r6c7"
    },
    "r7c8": {
      "r6c6": "r8c7",
      "r6c8": "r8c5",
      "r8c5": "r6c8",
      "r8c7": "r6c6"
    },
    "r7c9": {
      "r6c7": "r8c8",
      "r6c9": "r8c6",
      "r8c6": "r6c9",
      "r8c8": "r6c7"
    },
    "r8c1": {},
    "r8c2": {
      "r7c1": "r9c3",
      "r7c3": "r9c1",
      "r9c1": "r7c3",
      "r9c3": "r7c1"
    },
    "r8c3": {
      "r7c2": "r9c4",
      "r7c4": "r9c2",
      "r9c2": "r7c4",
      "r9c4": "r7c2"
    },
    "r8c4": {
      "r7c3": "r8c6",
      "r7c5": "r9c3",
      "r8c6": "r7c3",
      "r9c3": "r7c5"
    },
    "r8c5": {
      "r7c4": "r7c8",
      "r7c6": "r9c4",
      "r7c8": "r7c4",
      "r9c4": "r7c6"
    },
    "r8c6": {
      "r7c7": "r9c5",
      "r7c9": "r8c4",
      "r8c4": "r7c9",
      "r9c5": "r7c7"
    },
    "r8c7": {
      "r7c4": "r9c4",
      "r7c8": "r9c6",
      "r9c4": "r7c4",
      "r9c6": "r7c8"
    },
    "r8c8": {
      "r7c5": "r9c5",
      "r7c9": "r9c7",
      "r9c5": "r7c5",
      "r9c7": "r7c9"
    },
    "r8c9": {},
    "r9c1": {},
    "r9c2": {
      "r10c1": "r8c3",
      "r10c3": "r8c1",
      "r8c1": "r10c3",
      "r8c3": "r10c1"
    },
    "r9c3": {
      "r10c2": "r8c4",
      "r8c2": "r9c5",
      "r8c4": "r10c2",
      "r9c5": "r8c2"
    },
    "r9c4": {
      "r10c3": "r8c5",
      "r8c3": "r8c7",
      "r8c5": "r10c3",
      "r8c7": "r8c3"
    },
    "r9c5": {
      "r10c4": "r8c6",
      "r8c6": "r10c4",
      "r8c8": "r9c3",
      "r9c3": "r8c8"
    },
    "r9c6": {
      "r10c3": "r8c3",
      "r10c5": "r8c7",
      "r8c3": "r10c3",
      "r8c7": "r10c5"
    },
    "r9c7": {}
  }
}

/**
 * Semantic tags for special Archimedean cells (placeholder).
 * - “spiral seam / bridge”
 * - special pawn behavior (if any)
 * - special diagonal transitions (if any)
 */
export type CellTag =
  | "homeWhite"
  | "homeBlack"
  | "promotionWhite"
  | "promotionBlack"
  | "specialDiagonalJunction"
  | "spiralBridge";

export const CELL_TAGS: Record<CellId, CellTag[]> = Object.create(null);

function hasTag(cell: CellId, tag: CellTag): boolean {
  return CELL_TAGS[cell]?.includes(tag) ?? false;
}

/* -------------------------------------------------------
   SMALL HELPERS
-------------------------------------------------------- */

function pieceAt(pieces: RulesPiece[], cell: CellId): RulesPiece | undefined {
  return pieces.find((p) => p.position === cell);
}

function isEnemy(occ: RulesPiece | undefined, color: Side): boolean {
  return !!occ && occ.color !== color;
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* -------------------------------------------------------
   RAY TRACING (ROOK/BISHOP/QUEEN)
-------------------------------------------------------- */

/**
 * Follows a directed ray using a "next map" (edgeNext or vertexNext).
 *
 * prev = the cell we came from
 * cur  = current ray cell
 */
function rayFrom(
  pieces: RulesPiece[],
  prev: CellId,
  cur: CellId,
  color: Side,
  nextMap: Record<CellId, Record<CellId, CellId | null>>,
): CellId[] {
  const out: CellId[] = [];
  let p = prev;
  let c = cur;

  // very defensive loop cap
  const visited = new Set<string>();

  while (true) {
    const key = `${p}->${c}`;
    if (visited.has(key)) break;
    visited.add(key);

    const occ = pieceAt(pieces, c);
    if (!occ) {
      out.push(c);
    } else {
      if (isEnemy(occ, color)) out.push(c);
      break;
    }

    const nxt = nextMap[c]?.[p] ?? null;
    if (!nxt) break;

    p = c;
    c = nxt;
  }

  return out;
}

function rookMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const nbrs = ARCHIMEDEAN_GRAPH.edgeNbrs[from] ?? [];
  const out: CellId[] = [];
  for (const first of nbrs) {
    out.push(...rayFrom(pieces, from, first, color, ARCHIMEDEAN_GRAPH.edgeNext));
  }
  return uniq(out);
}

/**
 * Bishop movement on Archimedean Spiral:
 * - Base diagonal motion uses vertexNbrs + vertexNext (graph-defined diagonals)
 */
function bishopMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const out: CellId[] = [];
  const vNbrs = ARCHIMEDEAN_GRAPH.vertexNbrs[from] ?? [];
  for (const first of vNbrs) {
    out.push(
      ...rayFrom(pieces, from, first, color, ARCHIMEDEAN_GRAPH.vertexNext),
    );
  }

  return uniq(out);
}

function queenMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  return uniq([
    ...rookMoves(pieces, from, color),
    ...bishopMoves(pieces, from, color),
  ]);
}

/* -------------------------------------------------------
   KING / PRINCE
-------------------------------------------------------- */

function kingMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const e = ARCHIMEDEAN_GRAPH.edgeNbrs[from] ?? [];
  const v = ARCHIMEDEAN_GRAPH.vertexNbrs[from] ?? [];
  const nbrs = uniq([...e, ...v]);
  const out: CellId[] = [];

  for (const to of nbrs) {
    const occ = pieceAt(pieces, to);
    if (!occ || isEnemy(occ, color)) out.push(to);
  }

  // NOTE: Special king leap / castling (if Archimedean defines any)
  // would need either move history or explicit starting-square checks.
  return out;
}

function princeMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  // Default: prince behaves like king unless Archimedean defines something else.
  return kingMoves(pieces, from, color);
}

/* -------------------------------------------------------
   KNIGHT
-------------------------------------------------------- */

/**
 * Default spiral knight implementation:
 * "edge then vertex" OR "vertex then edge".
 */
function knightMoves(
  pieces: RulesPiece[],
  from: CellId,
  color: Side,
): CellId[] {
  const out = new Set<CellId>();

  const addIfOk = (to: CellId) => {
    const occ = pieceAt(pieces, to);
    if (!occ || isEnemy(occ, color)) out.add(to);
  };

  for (const e1 of ARCHIMEDEAN_GRAPH.edgeNbrs[from] ?? []) {
    for (const v2 of ARCHIMEDEAN_GRAPH.vertexNbrs[e1] ?? []) {
      if (v2 === from) continue;
      addIfOk(v2);
    }
  }

  for (const v1 of ARCHIMEDEAN_GRAPH.vertexNbrs[from] ?? []) {
    for (const e2 of ARCHIMEDEAN_GRAPH.edgeNbrs[v1] ?? []) {
      if (e2 === from) continue;
      addIfOk(e2);
    }
  }

  return Array.from(out);
}

/* -------------------------------------------------------
   PAWNS
-------------------------------------------------------- */

/**
 * Pawns on the Archimedean board are the trickiest part because "forward"
 * depends on the spiral’s orientation, not (row +/- 1).
 *
 * Strategy:
 * - Encode pawn-forward and pawn-capture relations into CELL_TAGS or into
 *   dedicated maps generated alongside the SVG graph.
 *
 * For now (placeholder):
 * - Pawn forward = any edge-neighbor that is tagged "towards opponent"
 * - Pawn capture = any vertex-neighbor similarly tagged
 */
const PAWN_FORWARD: Record<Side, Record<CellId, CellId[]>> = {
  wht: Object.create(null),
  blk: Object.create(null),
};
const PAWN_CAPTURES: Record<Side, Record<CellId, CellId[]>> = {
  wht: Object.create(null),
  blk: Object.create(null),
};

function pawnMoves(pieces: RulesPiece[], from: CellId, color: Side): CellId[] {
  const out: CellId[] = [];

  const forward = PAWN_FORWARD[color]?.[from] ?? [];
  const captures = PAWN_CAPTURES[color]?.[from] ?? [];

  for (const to of forward) {
    if (!pieceAt(pieces, to)) out.push(to);
  }

  for (const to of captures) {
    const occ = pieceAt(pieces, to);
    if (occ && isEnemy(occ, color)) out.push(to);
  }

  return uniq(out);
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

export function computePieceState(moves: Move[]): RulesPiece[] {
  const pieces: RulesPiece[] = initialPieces.map((p) => ({ ...p }));

  for (const mv of moves) {
    const from = mv.fromSquare as CellId;
    const to = mv.toSquare as CellId;

    const mover = pieces.find((p) => p.position === from);
    if (!mover) continue;

    const capturedIdx = pieces.findIndex((p) => p.position === to);
    if (capturedIdx >= 0) pieces.splice(capturedIdx, 1);

    mover.position = to;

    if (mv.promotion && mv.promotion !== "none") {
      mover.type = mv.promotion as PieceType;
    }
  }

  return pieces;
}

/**
 * Placeholder starting position.
 */
export const initialPieces: RulesPiece[] = [
  // Minimal test setup (safe)
  { type: "king", color: "wht", position: "a1" },
  { type: "king", color: "blk", position: "a2" },
];
