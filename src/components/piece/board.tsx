"use client";

import React, { useEffect, useState } from "react";
import Piece from "./piece";
import {
  initialPieces,
} from "shared/concentric-rules";
import {
  computePieceStateConcentric,
  generatePseudoLegalMovesForPieceConcentric,
} from "shared/concentric-rules";
import {
  computePieceStateArchimedean,
  generatePseudoLegalMovesForPieceArchimedean,
} from "shared/archimedean-rules";
import { Move } from "shared";
import {
  CONCENTRIC_GRAPH, ARCHIMEDEAN_GRAPH,
  PieceType,
  RulesPiece,
  Side,
} from "shared/graph";
import colors from "tailwindcss/colors"

type Space = {
  id: string;
  d: string;
  transform: string;
};

export type CapturedPiece = {
  type: string;
  color: string;
};

type BoardState = {
  pieces: RulesPiece[];
  selectedPiece: RulesPiece | null;
  selectedCell: string | null;
  legalMoves: string[];
  hoveredMove: string | null;
  pendingMove: string | null;
  capturedPieces: CapturedPiece[];
};

// Recompute from scratch every time — no stale state bugs
function computeCaptured(currentPieces: RulesPiece[]): CapturedPiece[] {
  const currentCounts = new Map<string, number>();
  for (const p of currentPieces) {
    const key = `${p.type}|${p.color}`;
    currentCounts.set(key, (currentCounts.get(key) ?? 0) + 1);
  }

  const initialCounts = new Map<string, number>();
  for (const p of initialPieces as RulesPiece[]) {
    const key = `${p.type}|${p.color}`;
    initialCounts.set(key, (initialCounts.get(key) ?? 0) + 1);
  }

  const captured: CapturedPiece[] = [];
  for (const [key, initialCount] of initialCounts) {
    const currentCount = currentCounts.get(key) ?? 0;
    const capturedCount = initialCount - currentCount;
    if (capturedCount <= 0) continue;
    const [type, color] = key.split("|");
    for (let i = 0; i < capturedCount; i++) captured.push({ type, color });
  }
  return captured;
}

export default function Board({
  moves,
  onMove,
  viewerSide,
  currentTurn,
  isSpectator,
  canControlBoth,
  variant,
  onCapturedPiecesChange,
  trackCapturedPieces = true,
  isReplayMode = false,
}: {
  moves: Move[];
  onMove: (from: string, to: string) => void;
  viewerSide: Side | undefined; // "white" | "black" | undefined
  currentTurn: Side; // whose turn it is
  isSpectator: boolean;
  canControlBoth: boolean;
  variant: "concentric" | "archimedean";
  onCapturedPiecesChange?: (captured: CapturedPiece[]) => void;
  trackCapturedPieces?: boolean;
  isReplayMode?: boolean;
}) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [boardState, setBoardState] = useState<BoardState>({
    pieces: JSON.parse(JSON.stringify(initialPieces)),
    selectedPiece: null,
    selectedCell: null,
    legalMoves: [],
    hoveredMove: null,
    pendingMove: null,
    capturedPieces: [],
  });
  const [piecesReady, setPiecesReady] = useState(false);

  useEffect(() => {
    setPiecesReady(true);
    const newPieces = variant === "concentric" ? computePieceStateConcentric(moves) : computePieceStateArchimedean(moves);
    const newCaptured = trackCapturedPieces
      ? computeCaptured(newPieces)
      : boardState.capturedPieces;

    if (trackCapturedPieces) {
      onCapturedPiecesChange?.(newCaptured);
    }

    // Clear ALL selection state atomically — fixes highlight-all bug
    setBoardState((prev) => ({
      ...prev,
      pieces: newPieces,
      capturedPieces: newCaptured,
      selectedPiece: null,
      selectedCell: null,
      legalMoves: [],
      hoveredMove: null,
      pendingMove: null,
    }));
  }, [moves]);

  useEffect(() => {
    fetch(variant === "concentric" ? "/cc/ccboard.svg" : "/as/asboard.svg")
      .then((res) => res.text())
      .then((svgText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const pathNodes = Array.from(doc.querySelectorAll("path"));
        setSpaces(
          pathNodes.map((node) => ({
            id: node.id || crypto.randomUUID(),
            transform: node.getAttribute("transform") || "",
            d: node.getAttribute("d") || "",
          })),
        );
      });
  }, []);

  const getCellCenter = (cellId: string): { x: number; y: number } => {
    if (typeof window !== "undefined") {
      const el = document.getElementById(cellId) as SVGPathElement | null;
      if (el?.getBBox) {
        try {
          const bbox = el.getBBox();
          return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
        } catch (e) {
          console.error("Error getting bbox for", cellId, e);
        }
      }
    }
    return { x: 0, y: 0 };
  };

  const calculateLegalMoves = (piece: RulesPiece): string[] => {
    const rulesPieces: RulesPiece[] = boardState.pieces.map((p) => ({
      type: p.type as PieceType,
      color: p.color as Side,
      position: p.position,
    }));
    const rulesPiece: RulesPiece = {
      type: piece.type as PieceType,
      color: piece.color as Side,
      position: piece.position,
    };
    return variant === "concentric"
      ? generatePseudoLegalMovesForPieceConcentric(rulesPiece, rulesPieces, moves)
      : generatePseudoLegalMovesForPieceArchimedean(rulesPiece, rulesPieces, moves);
  };

  const handleCellClick = (cellId: string) => {
    if (isReplayMode) return;
    if (isSpectator) return;
    if (!canControlBoth && viewerSide !== currentTurn) {
      return;
    }

    console.log("Cell clicked:", cellId);

    if (boardState.pendingMove === cellId && boardState.selectedPiece) {
      console.log("Move confirmed:", boardState.selectedPiece.position, "->", cellId);
      onMove(boardState.selectedPiece.position, cellId);
      // moves useEffect will clear state when new move arrives
      return;
    }

    if (boardState.selectedPiece && boardState.legalMoves.includes(cellId)) {
      console.log("Move pending:", boardState.selectedPiece.position, "->", cellId);
      setBoardState((prev) => ({
        ...prev,
        pendingMove: cellId,
        hoveredMove: null,
      }));
      return;
    }

    const pieceAtCell = boardState.pieces.find((p) => p.position === cellId);

    if (pieceAtCell) {
      // Spectators cannot select
      if (isSpectator) return;

      // Must be correct turn (unless controlling both)
      if (!canControlBoth && viewerSide !== currentTurn) return;

      // Determine which color this user is allowed to control right now
      const allowedColor = canControlBoth ? currentTurn : viewerSide;

      if (pieceAtCell.color !== allowedColor) return;

      // If clicking the already selected piece, deselect it
      if (pieceAtCell === boardState.selectedPiece) {
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: null,
          selectedCell: null,
          legalMoves: [],
          hoveredMove: null,
          pendingMove: null,
        }));
      } else {
        const legalMoves = calculateLegalMoves(pieceAtCell);
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: pieceAtCell,
          selectedCell: cellId,
          legalMoves,
          hoveredMove: null,
          pendingMove: null,
        }));
      }
    } else {
      setBoardState((prev) => ({
        ...prev,
        selectedPiece: null,
        selectedCell: null,
        legalMoves: [],
        hoveredMove: null,
        pendingMove: null,
      }));
    }
  };

  const handleCellHover = (cellId: string, entering: boolean) => {
    if (isReplayMode) return;
    if (!boardState.selectedPiece || boardState.pendingMove) return;
    if (boardState.legalMoves.includes(cellId)) {
      setBoardState((prev) => ({
        ...prev,
        hoveredMove: entering
          ? cellId
          : prev.hoveredMove === cellId
            ? null
            : prev.hoveredMove,
      }));
    }
  };

  const handlePieceClick = (piece: RulesPiece) => {
    if (isSpectator) return;
    if (viewerSide !== currentTurn) return;
    if (piece.color !== viewerSide) return;

    handleCellClick(piece.position);
  };

  // ── Cell colour logic ─────────────────────────────────────────────────────
  const getCellStyle = (cellId: string) => {
    // Dark green — locked pending move (first click, waiting for confirm)
    if (cellId === boardState.pendingMove) {
      return {
        fill: colors.yellow[400],
        fillOpacity: 1,
        stroke: "#000000",
        strokeWidth: 1,
      };
    }

    // Selected piece — yellow
    if (cellId === boardState.selectedCell) {
      return {
        fill: colors.green[400],
        fillOpacity: 1,
        stroke: "#000000",
        strokeWidth: 1,
      };
    }

    // Light green — hovering a legal square
    if (cellId === boardState.hoveredMove) {
      return {
        fill: colors.green[500],
        fillOpacity: 1,
        stroke: "#000000",
        strokeWidth: 1,
      };
    }

    // Yellow-ish tint — available legal moves
    if (boardState.legalMoves.includes(cellId)) {
      return {
        fill: colors.green[400],
        fillOpacity: 1,
        stroke: "#000000",
        strokeWidth: 1,
      };
    }
    const color = (variant === "concentric" ? CONCENTRIC_GRAPH : ARCHIMEDEAN_GRAPH).color[
      cellId
    ];
    const getColor = (color: "dark" | "light" | "dark1" | "light1" | "dark2" | "light2") => {
      switch (color) {
        case "dark":
          return colors.stone[700];
        case "light":
          return colors.stone[50];
        case "dark1":
          return colors.sky[500];
        case "light1":
          return colors.sky[200];
        case "dark2":
          return colors.stone[500];
        case "light2":
          return colors.stone[200];
      }
    }
    return {
      fill: getColor(color),
      fillOpacity: 1,
      stroke: "#000000",
      strokeWidth: 1,
    };
  };

  // The SVG viewBox is 0 0 1730 1730, but the board circle has radius 600 centered at (865,865),
  // so it spans 265–1465 in both axes (1200×1200 of 1730×1730 = ~69.4%). Scale up by 1730/1200
  // from the center so the board circle fills the container; overflow is clipped by the parent.
  const BOARD_SCALE = 1730 / (variant === "concentric" ? 1250 : 1400);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${BOARD_SCALE})${viewerSide === "blk" ? " rotate(180deg)" : ""}`,
        transformOrigin: "center center",
      }}>
        <svg
          viewBox="0 0 1730 1730"
          className="absolute w-full h-full"
          // want to prevent highlighting cells on double click, but still allow text selection for debugging
          onMouseDown={(e) => {
            if (e.detail > 1) {
              e.preventDefault();
            }
          }}
        >
          {spaces.map((s) => {
            const style = getCellStyle(s.id);
            const isLegal = boardState.legalMoves.includes(s.id);
            return (
              <path
                key={s.id}
                id={s.id}
                d={s.d}
                transform={s.transform}
                fill={style.fill}
                fillOpacity={style.fillOpacity}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeOpacity={1}
                style={{
                  cursor: isReplayMode
                    ? "default"
                    : isLegal ||
                      boardState.pieces.some((p) => p.position === s.id)
                      ? "pointer"
                      : "default",
                }}
                onClick={() => handleCellClick(s.id)}
                onMouseEnter={(e) => {
                  if (isReplayMode) return;
                  handleCellHover(s.id, true);
                  if (
                    !boardState.selectedPiece &&
                    !isLegal &&
                    s.id !== boardState.selectedCell
                  ) {
                    e.currentTarget.setAttribute("fill", colors.green[300]);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isReplayMode) return;
                  handleCellHover(s.id, false);
                  if (
                    !boardState.selectedPiece &&
                    !boardState.legalMoves.includes(s.id)
                  ) {
                    e.currentTarget.setAttribute("fill", style.fill);
                  }
                }}
              />
            );
          })}

          {/* Row labels for concentric board */}
          {variant === "concentric" && (() => {
            const FONT = 40;
            const isFlipped = viewerSide === "blk";
            const topItems = [
              { label: "a", y: 345, x: 580 },
              { label: "b", y: 445, x: 620 },
              { label: "c", y: 545, x: 640 },
              { label: "d", y: 645, x: 680 },
              { label: "e", y: 745, x: 720 },
              { label: "f", y: 845, x: 780 },
            ];
            const botItems = [
              { label: "g", y: 915 - 30, x: 950 },
              { label: "h", y: 1015 - 30, x: 1000 },
              { label: "i", y: 1115 - 30, x: 1030 },
              { label: "j", y: 1215 - 30, x: 1070 },
              { label: "k", y: 1315 - 30, x: 1100 },
              { label: "l", y: 1415 - 30, x: 1130 },
            ];
            const labelStyle: React.CSSProperties = { userSelect: "none", pointerEvents: "none" };
            return (
              <>
                {topItems.map(({ label, x, y }) => {
                  return (
                    <text key={label} x={x} y={y} fontSize={FONT}
                      fontFamily="sans-serif" fontWeight="bold"
                      textAnchor="start" dominantBaseline="central"
                      transform={isFlipped ? `rotate(180, ${x}, ${y})` : undefined}
                      fill="#000"
                      style={labelStyle}
                    >{label}</text>
                  );
                })}
                {botItems.map(({ label, x, y }) => {
                  return (
                    <text key={label} x={x} y={y} fontSize={FONT}
                      fontFamily="sans-serif" fontWeight="bold"
                      textAnchor="end" dominantBaseline="central"
                      fill="#fff"
                      transform={isFlipped ? `rotate(180, ${x}, ${y})` : undefined}
                      style={labelStyle}
                    >{label}</text>
                  );
                })}
              </>
            );
          })()}
        </svg>

        {piecesReady &&
          boardState.pieces
            .filter((piece) => {
              // Hide the piece at the pending destination — it will be captured
              if (boardState.pendingMove && boardState.selectedPiece) {
                if (piece.position === boardState.pendingMove && piece !== boardState.selectedPiece) {
                  return false;
                }
              }
              return true;
            })
            .map((piece) => {
              // Show the selected piece at its pending destination for preview
              const isMoving = !!(boardState.pendingMove && piece === boardState.selectedPiece);
              const displayPosition = isMoving ? boardState.pendingMove! : piece.position;
              const center = getCellCenter(displayPosition);
              return (
                <Piece
                  key={`${piece.position}-${piece.type}-${piece.color}`}
                  {...piece}
                  position={displayPosition}
                  x={center.x}
                  y={center.y}
                  onClick={() => handleCellClick(piece.position)}
                  isSelected={!isMoving && boardState.selectedPiece === piece}
                  variant={variant}
                  flipped={viewerSide === "blk"}
                />
              );
            })}
      </div>
    </div>
  );
}
// {
//   spaces.map((s) => {
//     return (
//       <span
//         key={s.id}
//         className={`size-piece ${s.id}a`}
//         style={{
//           position: "absolute",
//           // fontSize: "10px",
//           transform: "translate(20%, 30%)",
//           fontWeight: "bold",
//           pointerEvents: "none",
//           color: "#000",
//         }}
//       >
//         {s.id}
//       </span>
//     );
//   })
// }
