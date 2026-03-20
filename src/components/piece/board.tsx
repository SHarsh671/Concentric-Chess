"use client";

import React, { useEffect, useState } from "react";
import Piece from "./piece";
import { initialPieces } from "shared/concentric-rules";
import {
  computePieceStateConcentric,
  generatePseudoLegalMovesForPieceConcentric,
  validPromotionOptionsForMoveConcentric,
} from "shared/concentric-rules";
import {
  computePieceStateArchimedean,
  generatePseudoLegalMovesForPieceArchimedean,
  validPromotionOptionsForMoveArchimedean,
} from "shared/archimedean-rules";
import { Move } from "shared";
import {
  CONCENTRIC_GRAPH,
  ARCHIMEDEAN_GRAPH,
  PieceType,
  RulesPiece,
  Side,
} from "shared/graph";
import colors from "tailwindcss/colors";
import { toNotation } from "@/lib/utils";

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

type PendingPromotion = {
  from: string;
  to: string;
  options: PieceType[];
};

function computePiecesForMoves(
  variant: "concentric" | "archimedean",
  moves: Move[],
): RulesPiece[] {
  return variant === "concentric"
    ? computePieceStateConcentric(moves)
    : computePieceStateArchimedean(moves);
}

// Build captured list from per-move piece deltas so promotions are not counted as captures.
function computeCaptured(
  variant: "concentric" | "archimedean",
  moves: Move[],
): CapturedPiece[] {
  const captured: CapturedPiece[] = [];
  let prevPieces = computePiecesForMoves(variant, []);

  for (let i = 0; i < moves.length; i++) {
    const nextPieces = computePiecesForMoves(variant, moves.slice(0, i + 1));
    if (nextPieces.length < prevPieces.length) {
      const nextCounts = new Map<string, number>();
      for (const p of nextPieces) {
        const key = `${p.type}|${p.color}`;
        nextCounts.set(key, (nextCounts.get(key) ?? 0) + 1);
      }
      const capturedColor = moves[i].moveNumber % 2 === 1 ? "blk" : "wht";
      const prevCounts = new Map<string, number>();
      for (const p of prevPieces) {
        if (p.color !== capturedColor) continue;
        const key = `${p.type}|${p.color}`;
        prevCounts.set(key, (prevCounts.get(key) ?? 0) + 1);
      }
      for (const [key, prevCount] of prevCounts) {
        const nextCount = nextCounts.get(key) ?? 0;
        const diff = prevCount - nextCount;
        if (diff <= 0) continue;
        const [type, color] = key.split("|");
        for (let j = 0; j < diff; j++) captured.push({ type, color });
      }
    }
    prevPieces = nextPieces;
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
  gameOngoing = true,
  variant,
  onCapturedPiecesChange,
  trackCapturedPieces = true,
  isReplayMode = false,
}: {
  moves: Move[];
  onMove: (from: string, to: string, promotion?: PieceType | null) => void;
  viewerSide: Side | undefined; // "white" | "black" | undefined
  currentTurn: Side; // whose turn it is
  isSpectator: boolean;
  canControlBoth: boolean;
  gameOngoing?: boolean;
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
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);

  useEffect(() => {
    setPiecesReady(true);
    const newPieces = computePiecesForMoves(variant, moves);
    const newCaptured = trackCapturedPieces
      ? computeCaptured(variant, moves)
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
    setPendingPromotion(null);
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
      ? generatePseudoLegalMovesForPieceConcentric(
        rulesPiece,
        rulesPieces,
        moves,
      )
      : generatePseudoLegalMovesForPieceArchimedean(
        rulesPiece,
        rulesPieces,
        moves,
      );
  };

  const handleCellClick = (cellId: string) => {
    // if (isReplayMode) return;
    if (pendingPromotion) return;
    const canCommitMove =
      gameOngoing &&
      !isSpectator &&
      !isReplayMode &&
      (canControlBoth || viewerSide === currentTurn);

    console.log("Cell clicked:", cellId);

    if (canCommitMove && boardState.pendingMove === cellId && boardState.selectedPiece) {
      console.log(
        "Move confirmed:",
        boardState.selectedPiece.position,
        "->",
        cellId,
      );
      const promotionOptions =
        variant === "concentric"
          ? validPromotionOptionsForMoveConcentric(
            boardState.selectedPiece,
            cellId,
          )
          : validPromotionOptionsForMoveArchimedean(
            boardState.selectedPiece,
            cellId,
          );
      if (promotionOptions.length > 0) {
        setPendingPromotion({
          from: boardState.selectedPiece.position,
          to: cellId,
          options: promotionOptions,
        });
        return;
      }
      onMove(boardState.selectedPiece.position, cellId, null);
      // moves useEffect will clear state when new move arrives
      return;
    }

    if (
      canCommitMove &&
      boardState.selectedPiece &&
      boardState.legalMoves.includes(cellId)
    ) {
      console.log(
        "Move pending:",
        boardState.selectedPiece.position,
        "->",
        cellId,
      );
      setBoardState((prev) => ({
        ...prev,
        pendingMove: cellId,
        hoveredMove: null,
      }));
      return;
    }

    const pieceAtCell = boardState.pieces.find((p) => p.position === cellId);

    if (pieceAtCell) {
      if (!gameOngoing) {
        const legalMoves = calculateLegalMoves(pieceAtCell);
        setPendingPromotion(null);
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: pieceAtCell,
          selectedCell: cellId,
          legalMoves,
          hoveredMove: null,
          pendingMove: null,
        }));
        return;
      }

      if (isSpectator) {
        const legalMoves = calculateLegalMoves(pieceAtCell);
        setPendingPromotion(null);
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: pieceAtCell,
          selectedCell: cellId,
          legalMoves,
          hoveredMove: null,
          pendingMove: null,
        }));
        return;
      }

      // Determine which color this user is allowed to control right now.
      const allowedColor = canControlBoth ? currentTurn : viewerSide;
      const isControllablePiece = pieceAtCell.color === allowedColor;
      if (!isControllablePiece) {
        const legalMoves = calculateLegalMoves(pieceAtCell);
        setPendingPromotion(null);
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: pieceAtCell,
          selectedCell: cellId,
          legalMoves,
          hoveredMove: null,
          pendingMove: null,
        }));
        return;
      }

      // If clicking the already selected piece, deselect it
      if (pieceAtCell === boardState.selectedPiece) {
        setPendingPromotion(null);
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: null,
          selectedCell: null,
          legalMoves: [],
          hoveredMove: null,
          pendingMove: null,
        }));
      } else {
        setPendingPromotion(null);
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
      setPendingPromotion(null);
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

    // Preview-only legal moves for non-controllable selections.
    if (
      boardState.legalMoves.includes(cellId) &&
      boardState.selectedPiece &&
      (!gameOngoing ||
        isSpectator ||
        (canControlBoth
          ? boardState.selectedPiece.color !== currentTurn
          : boardState.selectedPiece.color !== viewerSide))
    ) {
      return {
        fill: colors.sky[300],
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
    const color = (
      variant === "concentric" ? CONCENTRIC_GRAPH : ARCHIMEDEAN_GRAPH
    ).color[cellId];
    const getColor = (
      color: "dark" | "light" | "dark1" | "light1" | "dark2" | "light2",
    ) => {
      switch (color) {
        case "dark":
          return colors.stone[500];
        case "light":
          return colors.stone[200];
        case "dark1":
          return colors.sky[500];
        case "light1":
          return colors.sky[200];
        case "dark2":
          return colors.stone[500];
        case "light2":
          return colors.stone[200];
      }
    };
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${BOARD_SCALE})${viewerSide === "blk" ? " rotate(180deg)" : ""
            }`,
          transformOrigin: "center center",
        }}
      >
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
          {variant === "concentric" &&
            (() => {
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
              const labelStyle: React.CSSProperties = {
                userSelect: "none",
                pointerEvents: "none",
              };
              return (
                <>
                  {topItems.map(({ label, x, y }) => {
                    return (
                      <text
                        key={label}
                        x={x}
                        y={y}
                        fontSize={FONT}
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        textAnchor="start"
                        dominantBaseline="central"
                        transform={
                          isFlipped ? `rotate(180, ${x}, ${y})` : undefined
                        }
                        fill="#000"
                        style={labelStyle}
                      >
                        {label}
                      </text>
                    );
                  })}
                  {botItems.map(({ label, x, y }) => {
                    return (
                      <text
                        key={label}
                        x={x}
                        y={y}
                        fontSize={FONT}
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        textAnchor="end"
                        dominantBaseline="central"
                        fill="#fff"
                        transform={
                          isFlipped ? `rotate(180, ${x}, ${y})` : undefined
                        }
                        style={labelStyle}
                      >
                        {label}
                      </text>
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
                if (
                  piece.position === boardState.pendingMove &&
                  piece !== boardState.selectedPiece
                ) {
                  return false;
                }
              }
              return true;
            })
            .map((piece) => {
              // Show the selected piece at its pending destination for preview
              const isMoving = !!(
                boardState.pendingMove && piece === boardState.selectedPiece
              );
              const displayPosition = isMoving
                ? boardState.pendingMove!
                : piece.position;
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
        {/* {spaces.map((s) => { */}
        {/*   return ( */}
        {/*     <span */}
        {/*       key={s.id} */}
        {/*       className={`size-piece ${s.id}a`} */}
        {/*       style={{ */}
        {/*         position: "absolute", */}
        {/*         fontSize: "10px", */}
        {/*         transform: "translate(20%, 30%)", */}
        {/*         fontWeight: "bold", */}
        {/*         pointerEvents: "none", */}
        {/*         color: */}
        {/*           CONCENTRIC_GRAPH.color[s.id] === "light" ? "#000" : "#fff", */}
        {/*       }} */}
        {/*     > */}
        {/*       {toNotation(s.id, variant)} */}
        {/*     </span> */}
        {/*   ); */}
        {/* })} */}
      </div>
      {pendingPromotion && (
        <div className="absolute inset-x-0 bottom-4 z-50 px-4">
          <div className="mx-auto w-full max-w-sm border-4 border-black bg-white p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest">
              Choose Promotion
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pendingPromotion.options.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    onMove(pendingPromotion.from, pendingPromotion.to, option)
                  }
                  className="border-2 border-black py-2 text-xs font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
                >
                  {option[0].toUpperCase()}
                  {option.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPendingPromotion(null)}
              className="mt-2 w-full border-2 border-black py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
