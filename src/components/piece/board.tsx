import React, { useEffect, useMemo, useState } from "react";
import Piece from "./piece";
import { GameVariant, Move } from "shared";
import {
  CONCENTRIC_GRAPH,
  ARCHIMEDEAN_GRAPH,
  PieceType,
  RulesPiece,
  Side,
} from "shared/graph";
import colors from "tailwindcss/colors";
import {
  getLegalMovesFromState,
  getPromotionOptionsForMove,
  getState,
  initialPieces,
} from "shared/rules";

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
  variant: GameVariant;
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
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotion | null>(null);

  const state = useMemo(() => {
    return getState(variant, moves);
  }, [variant, moves]);

  useEffect(() => {
    const newPieces = Array.from(state.board.values());
    const newCaptured = trackCapturedPieces ? state.captured : null;

    if (trackCapturedPieces && newCaptured) {
      onCapturedPiecesChange?.(newCaptured);
    }

    // Clear ALL selection state atomically — fixes highlight-all bug
    setBoardState((prev) => ({
      ...prev,
      pieces: newPieces,
      capturedPieces: newCaptured ?? prev.capturedPieces,
      selectedPiece: null,
      selectedCell: null,
      legalMoves: [],
      hoveredMove: null,
      pendingMove: null,
    }));
    setPendingPromotion(null);
  }, [
    moves,
    state.board,
    state.captured,
    trackCapturedPieces,
    onCapturedPiecesChange,
  ]);

  useEffect(() => {
    fetch(
      variant.startsWith("concentric") ? "/cc/ccboard.svg" : "/as/asboard.svg",
    )
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
  }, [variant]);

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
    return getLegalMovesFromState(state, piece.position);
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
    const pieceAtCell = boardState.pieces.find((p) => p.position === cellId);

    if (
      canCommitMove &&
      boardState.pendingMove === cellId &&
      boardState.selectedPiece &&
      boardState.selectedPiece.color === currentTurn
    ) {
      console.log(
        "Move confirmed:",
        boardState.selectedPiece.position,
        "->",
        cellId,
      );
      const promotionOptions = getPromotionOptionsForMove(
        boardState.selectedPiece.type,
        boardState.selectedPiece.color,
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
      boardState.legalMoves.includes(cellId) &&
      boardState.selectedPiece.color === currentTurn
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
        fill: colors.purple[400],
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
      variant.startsWith("concentric") ? CONCENTRIC_GRAPH : ARCHIMEDEAN_GRAPH
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
  const BOARD_SCALE = 1730 / (variant.startsWith("concentric") ? 1250 : 1400);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: isReplayMode ? "none" : "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${BOARD_SCALE})${
            viewerSide === "blk" ? " rotate(180deg)" : ""
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
          {variant.startsWith("concentric") &&
            (() => {
              const FONT = 40;
              const isFlipped = viewerSide === "blk";
              const topItems = isFlipped
                ? [
                    { label: "a", y: 385, x: 680 },
                    { label: "k", y: 385, x: 1070 },

                    { label: "b", y: 485, x: 675 },
                    { label: "j", y: 490, x: 1060 },

                    { label: "c", y: 585, x: 730 },
                    { label: "i", y: 585, x: 1025 },

                    { label: "d", y: 685, x: 760 },
                    { label: "h", y: 685, x: 995 },

                    { label: "e", y: 785, x: 795 },
                    { label: "g", y: 790, x: 965 },

                    { label: "f", y: 325, x: 675 },
                    { label: "f", y: 325, x: 1065 },
                  ]
                : [
                    { label: "a", y: 385, x: 650 },
                    { label: "k", y: 385, x: 1070 },

                    { label: "b", y: 485, x: 675 },
                    { label: "j", y: 485, x: 1055 },

                    { label: "c", y: 585, x: 700 },
                    { label: "i", y: 585, x: 1015 },

                    { label: "d", y: 685, x: 725 },
                    { label: "h", y: 685, x: 980 },

                    { label: "e", y: 780, x: 770 },
                    { label: "g", y: 780, x: 945 },

                    { label: "f", y: 325, x: 655 },
                    { label: "f", y: 325, x: 1070 },
                  ];
              const botItems = isFlipped
                ? [
                    { label: "e", y: 955, x: 800 },
                    { label: "g", y: 955, x: 960 },
                    { label: "d", y: 1045, x: 755 },
                    { label: "h", y: 1045, x: 1000 },
                    { label: "c", y: 1155, x: 745 },
                    { label: "i", y: 1145, x: 1015 },
                    { label: "b", y: 1245, x: 695 },
                    { label: "j", y: 1245, x: 1055 },
                    { label: "a", y: 1355, x: 695 },
                    { label: "k", y: 1345, x: 1075 },
                    { label: "f", y: 1400, x: 690 },
                    { label: "f", y: 1400, x: 1070 },
                  ]
                : [
                    { label: "e", y: 945, x: 770 },
                    { label: "g", y: 935, x: 945 },
                    { label: "d", y: 1045, x: 725 },
                    { label: "h", y: 1045, x: 980 },
                    { label: "c", y: 1145, x: 700 },
                    { label: "i", y: 1145, x: 1015 },
                    { label: "b", y: 1245, x: 675 },
                    { label: "j", y: 1235, x: 1055 },
                    { label: "a", y: 1345, x: 650 },
                    { label: "k", y: 1345, x: 1070 },
                    { label: "f", y: 1400, x: 655 },
                    { label: "f", y: 1400, x: 1070 },
                  ];
              const labelStyle: React.CSSProperties = {
                userSelect: "none",
                pointerEvents: "none",
                textAlign: "center",
              };
              return (
                <>
                  {topItems.map(({ label, x, y }) => {
                    return (
                      <text
                        key={`${label}-${x}-${y}`}
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
                        fill={isFlipped ? "#fff" : "#000"}
                        style={labelStyle}
                      >
                        {label}
                      </text>
                    );
                  })}
                  {botItems.map(({ label, x, y }) => {
                    return (
                      <text
                        key={`${label}-${x}-${y}`}
                        x={x}
                        y={y}
                        fontSize={FONT}
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        // textAnchor="end"
                        dominantBaseline="central"
                        fill={isFlipped ? "#fff" : "#000"}
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
          {variant.startsWith("archimedean") &&
            (() => {
              const FONT = 40;
              const isFlipped = viewerSide === "blk";
              const lightItems = isFlipped
                ? [
                    { label: "a", y: 380, x: 660 },
                    { label: "l", y: 380, x: 1040 },
                    { label: "b", y: 480, x: 660 },
                    { label: "k", y: 480, x: 1020 },
                    { label: "c", y: 575, x: 700 },
                    { label: "j", y: 580, x: 1000 },
                    { label: "d", y: 675, x: 715 },
                    { label: "i", y: 675, x: 965 },
                    { label: "e", y: 770, x: 750 },
                    { label: "h", y: 770, x: 935 },
                    { label: "f", y: 960, x: 810 },
                    { label: "i", y: 960, x: 1000 },
                    { label: "e", y: 1060, x: 785 },
                    { label: "j", y: 1050, x: 1045 },
                    { label: "d", y: 1145, x: 740 },
                    { label: "k", y: 1150, x: 1070 },
                    { label: "c", y: 1250, x: 720 },
                    { label: "l", y: 1245, x: 1085 },
                    { label: "b", y: 1345, x: 695 },
                    { label: "m", y: 1355, x: 1105 },
                  ]
                : [
                    { label: "a", y: 380, x: 610 },
                    { label: "l", y: 385, x: 1040 },
                    { label: "b", y: 485, x: 635 },
                    { label: "k", y: 485, x: 1030 },
                    { label: "c", y: 575, x: 660 },
                    { label: "j", y: 580, x: 1000 },
                    { label: "d", y: 680, x: 685 },
                    { label: "i", y: 680, x: 960 },
                    { label: "e", y: 770, x: 720 },
                    { label: "h", y: 775, x: 925 },
                    { label: "f", y: 960, x: 790 },
                    { label: "i", y: 960, x: 990 },
                    { label: "e", y: 1050, x: 760 },
                    { label: "j", y: 1045, x: 1035 },
                    { label: "d", y: 1145, x: 710 },
                    { label: "k", y: 1145, x: 1065 },
                    { label: "c", y: 1245, x: 695 },
                    { label: "l", y: 1245, x: 1080 },
                    { label: "b", y: 1345, x: 675 },
                    { label: "m", y: 1345, x: 1080 },
                  ];
              const darkItems = isFlipped
                ? [{ label: "g", y: 865, x: 905 }]
                : [{ label: "g", y: 860, x: 825 }];
              const labelStyle: React.CSSProperties = {
                userSelect: "none",
                pointerEvents: "none",
                textAlign: "center",
              };
              return (
                <>
                  {lightItems.map(({ label, x, y }) => {
                    return (
                      <text
                        key={`${label}-${x}-${y}`}
                        x={x}
                        y={y}
                        fontSize={FONT}
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        // textAnchor="start"
                        dominantBaseline="central"
                        transform={
                          isFlipped ? `rotate(180, ${x}, ${y})` : undefined
                        }
                        fill="#fff"
                        style={labelStyle}
                      >
                        {label}
                      </text>
                    );
                  })}
                  {darkItems.map(({ label, x, y }) => {
                    return (
                      <text
                        key={`${label}-${x}-${y}`}
                        x={x}
                        y={y}
                        fontSize={FONT}
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        // textAnchor="end"
                        dominantBaseline="central"
                        fill="#000"
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

        {boardState.pieces
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
                variant={
                  variant.startsWith("concentric")
                    ? "concentric"
                    : "archimedean"
                }
                flipped={viewerSide === "blk"}
              />
            );
          })}
        {/* {spaces.map((s) => { */}
        {/*   return ( */}
        {/*     <span */}
        {/*       key={s.id} */}
        {/*       // className={`size-piece ${s.id}a`} */}
        {/*       className={`size-piece ${s.id}`} */}
        {/*       style={{ */}
        {/*         position: "absolute", */}
        {/*         fontSize: "10px", */}
        {/*         transform: "translate(20%, 30%)", */}
        {/*         fontWeight: "bold", */}
        {/*         pointerEvents: "none", */}
        {/*         color: "#f00", */}
        {/*         // CONCENTRIC_GRAPH.color[s.id] === "light" ? "#000" : "#fff", */}
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
