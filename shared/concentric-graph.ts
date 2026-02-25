// shared/concentric-graph.ts
//
// Concentric Circle Chess board graph.
//
// This file is the single source of truth for:
// - adjacency across edges (orthogonal) and vertices (diagonal)
// - "continue straight" maps for ray pieces (rook/bishop/queen)
// - chessboard light/dark color of each cell
// - semantic tags used by special movement rules (crescent/halfMoon/twin)
//
// NOTE: The graph is built to satisfy the anchor neighbour assertions:
// - r12c1: edge {r11c1,r11c3}, vertex {r11c2}
// - r7c6:  edge {r7c5,r7c7,r6c6}, vertex {r8c5,r6c5,r6c7}
// - r9c3:  edge {r9c2,r9c4,r8c3,r10c3}, vertex {r10c2,r8c4,r8c2,r9c5}
// - r5c2:  edge {r6c2,r5c1,r5c3,r4c2}, vertex {r6c1,r6c3,r4c1,r4c3}

// export type CellId =
//   | "r1c1"
//   | "r2c1" | "r2c2" | "r2c3"
//   | "r3c1" | "r3c2" | "r3c3" | "r3c4" | "r3c5"
//   | "r4c1" | "r4c2" | "r4c3" | "r4c4" | "r4c5" | "r4c6" | "r4c7"
//   | "r5c1" | "r5c2" | "r5c3" | "r5c4" | "r5c5" | "r5c6" | "r5c7" | "r5c8" | "r5c9"
//   | "r6c1" | "r6c2" | "r6c3" | "r6c4" | "r6c5" | "r6c6" | "r6c7" | "r6c8" | "r6c9" | "r6c10" | "r6c11"
//   | "r7c1" | "r7c2" | "r7c3" | "r7c4" | "r7c5" | "r7c6" | "r7c7" | "r7c8" | "r7c9" | "r7c10" | "r7c11"
//   | "r8c1" | "r8c2" | "r8c3" | "r8c4" | "r8c5" | "r8c6" | "r8c7" | "r8c8" | "r8c9"
//   | "r9c1" | "r9c2" | "r9c3" | "r9c4" | "r9c5" | "r9c6" | "r9c7"
//   | "r10c1" | "r10c2" | "r10c3" | "r10c4" | "r10c5"
//   | "r11c1" | "r11c2" | "r11c3"
//   | "r12c1";
export type CellId = string;

export type CellColor = "light" | "dark";
export type CellTag = "crescent" | "halfMoon" | "twin";

export type BoardGraph = {
  // neighbours across an edge (line)
  edgeNbrs: Record<CellId, CellId[]>;
  // neighbours across a vertex (corner)
  vertexNbrs: Record<CellId, CellId[]>;
  // when passing through key, it maps the entry edge to the opposite exit edge
  edgeNext: Record<CellId, Partial<Record<CellId, CellId | null>>>;
  // when passing through key, it maps the entry vertex to the opposite exit vertex
  vertexNext: Record<CellId, Partial<Record<CellId, CellId | null>>>;
  color: Record<CellId, CellColor>;
};

// auto generated with the concentric-graph Rust project in the repo
export const CONCENTRIC_GRAPH: BoardGraph =
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
    "r1c1": "dark",
    "r2c1": "light",
    "r2c2": "dark",
    "r2c3": "light",
    "r3c1": "dark",
    "r3c2": "light",
    "r3c3": "dark",
    "r3c4": "light",
    "r3c5": "dark",
    "r4c1": "light",
    "r4c2": "dark",
    "r4c3": "light",
    "r4c4": "dark",
    "r4c5": "light",
    "r4c6": "dark",
    "r4c7": "light",
    "r5c1": "dark",
    "r5c2": "light",
    "r5c3": "dark",
    "r5c4": "light",
    "r5c5": "dark",
    "r5c6": "light",
    "r5c7": "dark",
    "r5c8": "light",
    "r5c9": "dark",
    "r6c1": "light",
    "r6c10": "dark",
    "r6c11": "light",
    "r6c2": "dark",
    "r6c3": "light",
    "r6c4": "dark",
    "r6c5": "light",
    "r6c6": "dark",
    "r6c7": "light",
    "r6c8": "dark",
    "r6c9": "light",
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
      "r10c2",
      "r9c1"
    ],
    "r10c2": [
      "r10c3",
      "r11c2",
      "r10c1",
      "r9c2"
    ],
    "r10c3": [
      "r10c4",
      "r9c5",
      "r10c2",
      "r9c3"
    ],
    "r10c4": [
      "r9c6",
      "r10c3",
      "r10c5",
      "r11c2"
    ],
    "r10c5": [
      "r11c3",
      "r10c4",
      "r9c7"
    ],
    "r11c1": [
      "r10c1",
      "r11c2",
      "r12c1"
    ],
    "r11c2": [
      "r11c3",
      "r11c1",
      "r10c4",
      "r10c2"
    ],
    "r11c3": [
      "r10c5",
      "r11c2",
      "r12c1"
    ],
    "r12c1": [
      "r11c1",
      "r11c3"
    ],
    "r1c1": [
      "r2c1",
      "r2c3"
    ],
    "r2c1": [
      "r3c1",
      "r1c1",
      "r2c2"
    ],
    "r2c2": [
      "r3c2",
      "r2c3",
      "r2c1",
      "r3c4"
    ],
    "r2c3": [
      "r1c1",
      "r2c2",
      "r3c5"
    ],
    "r3c1": [
      "r4c1",
      "r2c1",
      "r3c2"
    ],
    "r3c2": [
      "r3c3",
      "r4c2",
      "r3c1",
      "r2c2"
    ],
    "r3c3": [
      "r3c4",
      "r4c5",
      "r3c2",
      "r4c3"
    ],
    "r3c4": [
      "r2c2",
      "r3c3",
      "r3c5",
      "r4c6"
    ],
    "r3c5": [
      "r4c7",
      "r2c3",
      "r3c4"
    ],
    "r4c1": [
      "r4c2",
      "r5c1",
      "r3c1"
    ],
    "r4c2": [
      "r5c2",
      "r4c3",
      "r4c1",
      "r3c2"
    ],
    "r4c3": [
      "r4c4",
      "r3c3",
      "r4c2",
      "r5c3"
    ],
    "r4c4": [
      "r5c6",
      "r5c4",
      "r4c3",
      "r4c5"
    ],
    "r4c5": [
      "r4c6",
      "r5c7",
      "r4c4",
      "r3c3"
    ],
    "r4c6": [
      "r4c5",
      "r5c8",
      "r4c7",
      "r3c4"
    ],
    "r4c7": [
      "r4c6",
      "r5c9",
      "r3c5"
    ],
    "r5c1": [
      "r4c1",
      "r5c2",
      "r6c1"
    ],
    "r5c2": [
      "r5c1",
      "r4c2",
      "r6c2",
      "r5c3"
    ],
    "r5c3": [
      "r5c2",
      "r6c3",
      "r4c3",
      "r5c4"
    ],
    "r5c4": [
      "r5c3",
      "r6c4",
      "r4c4",
      "r5c5"
    ],
    "r5c5": [
      "r6c5",
      "r6c7",
      "r5c4",
      "r5c6"
    ],
    "r5c6": [
      "r5c7",
      "r6c8",
      "r4c4",
      "r5c5"
    ],
    "r5c7": [
      "r6c9",
      "r5c8",
      "r4c5",
      "r5c6"
    ],
    "r5c8": [
      "r5c7",
      "r6c10",
      "r4c6",
      "r5c9"
    ],
    "r5c9": [
      "r5c8",
      "r4c7",
      "r6c11"
    ],
    "r6c1": [
      "r7c1",
      "r5c1",
      "r6c2"
    ],
    "r6c10": [
      "r6c9",
      "r6c11",
      "r5c8",
      "r7c10"
    ],
    "r6c11": [
      "r7c11",
      "r5c9",
      "r6c10"
    ],
    "r6c2": [
      "r5c2",
      "r7c2",
      "r6c1",
      "r6c3"
    ],
    "r6c3": [
      "r5c3",
      "r6c4",
      "r6c2",
      "r7c3"
    ],
    "r6c4": [
      "r6c3",
      "r5c4",
      "r6c5",
      "r7c4"
    ],
    "r6c5": [
      "r5c5",
      "r7c5",
      "r6c6",
      "r6c4"
    ],
    "r6c6": [
      "r7c6",
      "r6c5",
      "r6c7"
    ],
    "r6c7": [
      "r5c5",
      "r6c8",
      "r7c7",
      "r6c6"
    ],
    "r6c8": [
      "r6c7",
      "r6c9",
      "r5c6",
      "r7c8"
    ],
    "r6c9": [
      "r5c7",
      "r6c10",
      "r7c9",
      "r6c8"
    ],
    "r7c1": [
      "r6c1",
      "r7c2",
      "r8c1"
    ],
    "r7c10": [
      "r7c9",
      "r8c8",
      "r7c11",
      "r6c10"
    ],
    "r7c11": [
      "r7c10",
      "r8c9",
      "r6c11"
    ],
    "r7c2": [
      "r8c2",
      "r6c2",
      "r7c1",
      "r7c3"
    ],
    "r7c3": [
      "r7c4",
      "r7c2",
      "r6c3",
      "r8c3"
    ],
    "r7c4": [
      "r7c3",
      "r7c5",
      "r8c4",
      "r6c4"
    ],
    "r7c5": [
      "r6c5",
      "r7c4",
      "r7c6",
      "r8c5"
    ],
    "r7c6": [
      "r7c5",
      "r6c6",
      "r7c7"
    ],
    "r7c7": [
      "r7c6",
      "r7c8",
      "r6c7",
      "r8c5"
    ],
    "r7c8": [
      "r6c8",
      "r7c7",
      "r7c9",
      "r8c6"
    ],
    "r7c9": [
      "r7c8",
      "r6c9",
      "r8c7",
      "r7c10"
    ],
    "r8c1": [
      "r7c1",
      "r8c2",
      "r9c1"
    ],
    "r8c2": [
      "r8c3",
      "r9c2",
      "r7c2",
      "r8c1"
    ],
    "r8c3": [
      "r9c3",
      "r8c4",
      "r7c3",
      "r8c2"
    ],
    "r8c4": [
      "r8c5",
      "r7c4",
      "r9c4",
      "r8c3"
    ],
    "r8c5": [
      "r7c7",
      "r8c4",
      "r7c5",
      "r8c6"
    ],
    "r8c6": [
      "r8c7",
      "r7c8",
      "r9c4",
      "r8c5"
    ],
    "r8c7": [
      "r8c8",
      "r7c9",
      "r8c6",
      "r9c5"
    ],
    "r8c8": [
      "r8c9",
      "r9c6",
      "r8c7",
      "r7c10"
    ],
    "r8c9": [
      "r7c11",
      "r8c8",
      "r9c7"
    ],
    "r9c1": [
      "r10c1",
      "r8c1",
      "r9c2"
    ],
    "r9c2": [
      "r9c3",
      "r8c2",
      "r9c1",
      "r10c2"
    ],
    "r9c3": [
      "r9c4",
      "r9c2",
      "r8c3",
      "r10c3"
    ],
    "r9c4": [
      "r9c5",
      "r9c3",
      "r8c6",
      "r8c4"
    ],
    "r9c5": [
      "r8c7",
      "r9c4",
      "r10c3",
      "r9c6"
    ],
    "r9c6": [
      "r10c4",
      "r9c5",
      "r9c7",
      "r8c8"
    ],
    "r9c7": [
      "r8c9",
      "r10c5",
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
      "r5c1": "r7c1",
      "r7c1": "r5c1"
    },
    "r6c10": {
      "r5c8": "r7c10",
      "r6c11": "r6c9",
      "r6c9": "r6c11",
      "r7c10": "r5c8"
    },
    "r6c11": {
      "r5c9": "r7c11",
      "r7c11": "r5c9"
    },
    "r6c2": {
      "r5c2": "r7c2",
      "r6c1": "r6c3",
      "r6c3": "r6c1",
      "r7c2": "r5c2"
    },
    "r6c3": {
      "r5c3": "r7c3",
      "r6c2": "r6c4",
      "r6c4": "r6c2",
      "r7c3": "r5c3"
    },
    "r6c4": {
      "r5c4": "r7c4",
      "r6c3": "r6c5",
      "r6c5": "r6c3",
      "r7c4": "r5c4"
    },
    "r6c5": {
      "r5c5": "r7c5",
      "r6c4": "r6c6",
      "r6c6": "r6c4",
      "r7c5": "r5c5"
    },
    "r6c6": {
      "r6c5": "r6c7",
      "r6c7": "r6c5"
    },
    "r6c7": {
      "r5c5": "r7c7",
      "r6c6": "r6c8",
      "r6c8": "r6c6",
      "r7c7": "r5c5"
    },
    "r6c8": {
      "r5c6": "r7c8",
      "r6c7": "r6c9",
      "r6c9": "r6c7",
      "r7c8": "r5c6"
    },
    "r6c9": {
      "r5c7": "r7c9",
      "r6c10": "r6c8",
      "r6c8": "r6c10",
      "r7c9": "r5c7"
    },
    "r7c1": {
      "r6c1": "r8c1",
      "r8c1": "r6c1"
    },
    "r7c10": {
      "r6c10": "r8c8",
      "r7c11": "r7c9",
      "r7c9": "r7c11",
      "r8c8": "r6c10"
    },
    "r7c11": {
      "r6c11": "r8c9",
      "r8c9": "r6c11"
    },
    "r7c2": {
      "r6c2": "r8c2",
      "r7c1": "r7c3",
      "r7c3": "r7c1",
      "r8c2": "r6c2"
    },
    "r7c3": {
      "r6c3": "r8c3",
      "r7c2": "r7c4",
      "r7c4": "r7c2",
      "r8c3": "r6c3"
    },
    "r7c4": {
      "r6c4": "r8c4",
      "r7c3": "r7c5",
      "r7c5": "r7c3",
      "r8c4": "r6c4"
    },
    "r7c5": {
      "r6c5": "r8c5",
      "r7c4": "r7c6",
      "r7c6": "r7c4",
      "r8c5": "r6c5"
    },
    "r7c6": {
      "r7c5": "r7c7",
      "r7c7": "r7c5"
    },
    "r7c7": {
      "r6c7": "r8c5",
      "r7c6": "r7c8",
      "r7c8": "r7c6",
      "r8c5": "r6c7"
    },
    "r7c8": {
      "r6c8": "r8c6",
      "r7c7": "r7c9",
      "r7c9": "r7c7",
      "r8c6": "r6c8"
    },
    "r7c9": {
      "r6c9": "r8c7",
      "r7c10": "r7c8",
      "r7c8": "r7c10",
      "r8c7": "r6c9"
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
      "r9c1",
      "r9c3",
      "r10c4",
      "r11c1"
    ],
    "r10c3": [
      "r9c6",
      "r11c2",
      "r9c4",
      "r9c2"
    ],
    "r10c4": [
      "r9c5",
      "r11c3",
      "r10c2",
      "r9c7"
    ],
    "r10c5": [
      "r9c6",
      "r11c2"
    ],
    "r11c1": [
      "r10c2",
      "r11c3"
    ],
    "r11c2": [
      "r10c3",
      "r12c1",
      "r10c5",
      "r10c1"
    ],
    "r11c3": [
      "r10c4",
      "r11c1"
    ],
    "r12c1": [
      "r11c2"
    ],
    "r1c1": [
      "r2c2"
    ],
    "r2c1": [
      "r3c2",
      "r2c3"
    ],
    "r2c2": [
      "r3c1",
      "r3c3",
      "r1c1",
      "r3c5"
    ],
    "r2c3": [
      "r2c1",
      "r3c4"
    ],
    "r3c1": [
      "r4c2",
      "r2c2"
    ],
    "r3c2": [
      "r3c4",
      "r4c3",
      "r2c1",
      "r4c1"
    ],
    "r3c3": [
      "r2c2",
      "r4c6",
      "r4c4",
      "r4c2"
    ],
    "r3c4": [
      "r4c7",
      "r2c3",
      "r4c5",
      "r3c2"
    ],
    "r3c5": [
      "r4c6",
      "r2c2"
    ],
    "r4c1": [
      "r3c2",
      "r5c2"
    ],
    "r4c2": [
      "r5c1",
      "r3c3",
      "r5c3",
      "r3c1"
    ],
    "r4c3": [
      "r5c2",
      "r3c2",
      "r4c5",
      "r5c4"
    ],
    "r4c4": [
      "r5c7",
      "r5c3",
      "r5c5",
      "r3c3"
    ],
    "r4c5": [
      "r3c4",
      "r4c3",
      "r5c8",
      "r5c6"
    ],
    "r4c6": [
      "r5c7",
      "r3c5",
      "r3c3",
      "r5c9"
    ],
    "r4c7": [
      "r5c8",
      "r3c4"
    ],
    "r5c1": [
      "r6c2",
      "r4c2"
    ],
    "r5c2": [
      "r6c3",
      "r4c3",
      "r6c1",
      "r4c1"
    ],
    "r5c3": [
      "r6c4",
      "r4c4",
      "r6c2",
      "r4c2"
    ],
    "r5c4": [
      "r4c3",
      "r5c6",
      "r6c3",
      "r6c5"
    ],
    "r5c5": [
      "r6c8",
      "r6c4",
      "r4c4",
      "r6c6"
    ],
    "r5c6": [
      "r4c5",
      "r6c7",
      "r6c9",
      "r5c4"
    ],
    "r5c7": [
      "r6c8",
      "r4c6",
      "r4c4",
      "r6c10"
    ],
    "r5c8": [
      "r6c11",
      "r6c9",
      "r4c5",
      "r4c7"
    ],
    "r5c9": [
      "r6c10",
      "r4c6"
    ],
    "r6c1": [
      "r5c2",
      "r7c2"
    ],
    "r6c10": [
      "r5c7",
      "r7c11",
      "r5c9",
      "r7c9"
    ],
    "r6c11": [
      "r7c10",
      "r5c8"
    ],
    "r6c2": [
      "r5c1",
      "r7c1",
      "r5c3",
      "r7c3"
    ],
    "r6c3": [
      "r7c2",
      "r7c4",
      "r5c2",
      "r5c4"
    ],
    "r6c4": [
      "r7c3",
      "r5c5",
      "r5c3",
      "r7c5"
    ],
    "r6c5": [
      "r5c4",
      "r7c6",
      "r6c7",
      "r7c4"
    ],
    "r6c6": [
      "r7c7",
      "r5c5",
      "r7c5"
    ],
    "r6c7": [
      "r7c6",
      "r7c8",
      "r5c6",
      "r6c5"
    ],
    "r6c8": [
      "r7c7",
      "r5c5",
      "r5c7",
      "r7c9"
    ],
    "r6c9": [
      "r7c10",
      "r7c8",
      "r5c8",
      "r5c6"
    ],
    "r7c1": [
      "r8c2",
      "r6c2"
    ],
    "r7c10": [
      "r6c9",
      "r8c7",
      "r8c9",
      "r6c11"
    ],
    "r7c11": [
      "r6c10",
      "r8c8"
    ],
    "r7c2": [
      "r8c3",
      "r8c1",
      "r6c1",
      "r6c3"
    ],
    "r7c3": [
      "r8c4",
      "r8c2",
      "r6c4",
      "r6c2"
    ],
    "r7c4": [
      "r6c3",
      "r8c5",
      "r6c5",
      "r8c3"
    ],
    "r7c5": [
      "r6c6",
      "r6c4",
      "r7c7",
      "r8c4"
    ],
    "r7c6": [
      "r8c5",
      "r6c7",
      "r6c5"
    ],
    "r7c7": [
      "r7c5",
      "r6c6",
      "r6c8",
      "r8c6"
    ],
    "r7c8": [
      "r8c7",
      "r6c9",
      "r6c7",
      "r8c5"
    ],
    "r7c9": [
      "r6c10",
      "r6c8",
      "r8c8",
      "r8c6"
    ],
    "r8c1": [
      "r7c2",
      "r9c2"
    ],
    "r8c2": [
      "r9c1",
      "r7c1",
      "r9c3",
      "r7c3"
    ],
    "r8c3": [
      "r7c2",
      "r9c2",
      "r7c4",
      "r9c4"
    ],
    "r8c4": [
      "r9c3",
      "r7c5",
      "r7c3",
      "r8c6"
    ],
    "r8c5": [
      "r7c6",
      "r7c8",
      "r7c4",
      "r9c4"
    ],
    "r8c6": [
      "r9c5",
      "r7c7",
      "r7c9",
      "r8c4"
    ],
    "r8c7": [
      "r9c6",
      "r9c4",
      "r7c8",
      "r7c10"
    ],
    "r8c8": [
      "r7c9",
      "r7c11",
      "r9c5",
      "r9c7"
    ],
    "r8c9": [
      "r9c6",
      "r7c10"
    ],
    "r9c1": [
      "r10c2",
      "r8c2"
    ],
    "r9c2": [
      "r8c3",
      "r10c3",
      "r10c1",
      "r8c1"
    ],
    "r9c3": [
      "r9c5",
      "r10c2",
      "r8c2",
      "r8c4"
    ],
    "r9c4": [
      "r10c3",
      "r8c3",
      "r8c5",
      "r8c7"
    ],
    "r9c5": [
      "r10c4",
      "r8c6",
      "r9c3",
      "r8c8"
    ],
    "r9c6": [
      "r10c5",
      "r10c3",
      "r8c9",
      "r8c7"
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
    "r6c1": {},
    "r6c10": {
      "r5c7": "r7c11",
      "r5c9": "r7c9",
      "r7c11": "r5c7",
      "r7c9": "r5c9"
    },
    "r6c11": {},
    "r6c2": {
      "r5c1": "r7c3",
      "r5c3": "r7c1",
      "r7c1": "r5c3",
      "r7c3": "r5c1"
    },
    "r6c3": {
      "r5c2": "r7c4",
      "r5c4": "r7c2",
      "r7c2": "r5c4",
      "r7c4": "r5c2"
    },
    "r6c4": {
      "r5c3": "r7c5",
      "r5c5": "r7c3",
      "r7c3": "r5c5",
      "r7c5": "r5c3"
    },
    "r6c5": {
      "r5c4": "r7c6",
      "r6c7": "r7c4",
      "r7c4": "r6c7",
      "r7c6": "r5c4"
    },
    "r6c6": {
      "r7c5": "r7c7",
      "r7c7": "r7c5"
    },
    "r6c7": {
      "r5c6": "r7c6",
      "r6c5": "r7c8",
      "r7c6": "r5c6",
      "r7c8": "r6c5"
    },
    "r6c8": {
      "r5c5": "r7c9",
      "r5c7": "r7c7",
      "r7c7": "r5c7",
      "r7c9": "r5c5"
    },
    "r6c9": {
      "r5c6": "r7c10",
      "r5c8": "r7c8",
      "r7c10": "r5c6",
      "r7c8": "r5c8"
    },
    "r7c1": {},
    "r7c10": {
      "r6c11": "r8c7",
      "r6c9": "r8c9",
      "r8c7": "r6c11",
      "r8c9": "r6c9"
    },
    "r7c11": {},
    "r7c2": {
      "r6c1": "r8c3",
      "r6c3": "r8c1",
      "r8c1": "r6c3",
      "r8c3": "r6c1"
    },
    "r7c3": {
      "r6c2": "r8c4",
      "r6c4": "r8c2",
      "r8c2": "r6c4",
      "r8c4": "r6c2"
    },
    "r7c4": {
      "r6c3": "r8c5",
      "r6c5": "r8c3",
      "r8c3": "r6c5",
      "r8c5": "r6c3"
    },
    "r7c5": {
      "r6c4": "r7c7",
      "r6c6": "r8c4",
      "r7c7": "r6c4",
      "r8c4": "r6c6"
    },
    "r7c6": {
      "r6c5": "r6c7",
      "r6c7": "r6c5"
    },
    "r7c7": {
      "r6c6": "r8c6",
      "r6c8": "r7c5",
      "r7c5": "r6c8",
      "r8c6": "r6c6"
    },
    "r7c8": {
      "r6c7": "r8c7",
      "r6c9": "r8c5",
      "r8c5": "r6c9",
      "r8c7": "r6c7"
    },
    "r7c9": {
      "r6c10": "r8c6",
      "r6c8": "r8c8",
      "r8c6": "r6c10",
      "r8c8": "r6c8"
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
};

/**
 * Semantic tags for special-rule cells.
 *
 * Derived these from the stable rNcM naming convention:
 * - "crescent": the centerline cell in each row (middle column)
 * - "halfMoon": the two central crescents (r6c6 and r7c6)
 * - "twin": the two cells horizontally adjacent to a crescent/halfMoon (same row, +/-1 col)
 *
 * This keeps movement rules independent of concentric-grid.ts.
 */
export const CELL_TAGS: Record<CellId, CellTag[]> = (() => {
  const tags: Record<CellId, CellTag[]> = Object.create(null);

  // initialize
  for (const id of Object.keys(CONCENTRIC_GRAPH.color)) {
    tags[id] = [];
  }

  // group by row
  const rows: Record<number, number[]> = Object.create(null);
  for (const id of Object.keys(CONCENTRIC_GRAPH.color)) {
    const m = id.match(/^r(\d+)c(\d+)$/);
    if (!m) continue;
    const r = Number(m[1]);
    const c = Number(m[2]);
    (rows[r] ??= []).push(c);
  }

  for (const rStr of Object.keys(rows)) {
    const r = Number(rStr);
    const cols = rows[r].sort((a, b) => a - b);
    const mid = cols[Math.floor(cols.length / 2)];

    const crescent = `r${r}c${mid}`;
    if (tags[crescent] && !tags[crescent].includes("crescent")) {
      tags[crescent].push("crescent");
    }

    const leftTwin = `r${r}c${mid - 1}`;
    const rightTwin = `r${r}c${mid + 1}`;
    if (tags[leftTwin] && !tags[leftTwin].includes("twin")) tags[leftTwin].push("twin");
    if (tags[rightTwin] && !tags[rightTwin].includes("twin")) tags[rightTwin].push("twin");
  }

  // half-moons are the two central crescents
  for (const hm of ["r6c6", "r7c6"] as const) {
    if (tags[hm]) {
      if (!tags[hm].includes("halfMoon")) tags[hm].push("halfMoon");
      if (!tags[hm].includes("crescent")) tags[hm].push("crescent");
    }
  }

  return tags;
})();
