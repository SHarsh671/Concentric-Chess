"use client";

import { useEffect, useState } from "react";
import Piece, { PieceProps } from "./piece";
import {
  computePieceState,
  generatePseudoLegalMovesForPiece,
  initialPieces,
  PieceType,
  RulesPiece,
  Side,
} from "shared/concentric-rules";
import { Move } from "shared";
import { CONCENTRIC_GRAPH } from "../../../shared/concentric-graph";

type Space = {
  id: string;
  d: string;
};

type BoardState = {
  pieces: PieceProps[];
  selectedPiece: PieceProps | null;
  selectedCell: string | null;
  legalMoves: string[];
  hoveredMove: string | null;   // light green — hovering a legal square
  pendingMove: string | null;   // dark green  — clicked once, waiting to confirm
};

export default function Board({
  moves,
  onMove,
}: {
  moves: Move[];
  onMove: (from: string, to: string) => void;
}) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [boardState, setBoardState] = useState<BoardState>({
    pieces: JSON.parse(JSON.stringify(initialPieces)),
    selectedPiece: null,
    selectedCell: null,
    legalMoves: [],
    hoveredMove: null,
    pendingMove: null,
  });
  const [piecesReady, setPiecesReady] = useState(false);

  useEffect(() => {
    console.log("Moves received:", moves);
    setPiecesReady(true);
    setBoardState((prev) => ({
      ...prev,
      pieces: computePieceState(moves),
    }));
  }, [moves]);

  useEffect(() => {
    fetch("/as/asboard.svg")
      .then((res) => res.text())
      .then((svgText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const pathNodes = Array.from(doc.querySelectorAll("path"));
        setSpaces(
          pathNodes.map((node) => ({
            id: node.id || crypto.randomUUID(),
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

  const calculateLegalMoves = (piece: PieceProps): string[] => {
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
    return generatePseudoLegalMovesForPiece(rulesPiece, rulesPieces);
  };

  const handleCellClick = (cellId: string) => {
    console.log("Cell clicked:", cellId);

    // ── Confirm pending move ──────────────────────────────────────────────
    if (boardState.pendingMove === cellId && boardState.selectedPiece) {
      onMove(boardState.selectedPiece.position, cellId);
      setBoardState((prev) => ({
        ...prev,
        selectedPiece: null,
        selectedCell: null,
        legalMoves: [],
        hoveredMove: null,
        pendingMove: null,
      }));
      return;
    }

    // ── Lock a legal move as pending (first click on destination) ─────────
    if (boardState.selectedPiece && boardState.legalMoves.includes(cellId)) {
      setBoardState((prev) => ({
        ...prev,
        pendingMove: cellId,
        hoveredMove: null,
      }));
      return;
    }

    // ── Select / deselect a piece ─────────────────────────────────────────
    const pieceAtCell = boardState.pieces.find((p) => p.position === cellId);

    if (pieceAtCell) {
      if (pieceAtCell === boardState.selectedPiece) {
        // Deselect
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: null,
          selectedCell: null,
          legalMoves: [],
          hoveredMove: null,
          pendingMove: null,
        }));
      } else {
        // Select new piece
        const legalMoves = calculateLegalMoves(pieceAtCell);
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: pieceAtCell,
          selectedCell: cellId,
          legalMoves,
          hoveredMove: null,
          pendingMove: null,
        }));
        console.log("Selected:", pieceAtCell, "Moves:", legalMoves);
      }
    } else {
      // Click on empty non-legal cell — deselect
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
    // Only care about hovering legal move squares when a piece is selected
    // and no move is locked yet
    if (!boardState.selectedPiece || boardState.pendingMove) return;
    if (boardState.legalMoves.includes(cellId)) {
      setBoardState((prev) => ({
        ...prev,
        hoveredMove: entering ? cellId : prev.hoveredMove === cellId ? null : prev.hoveredMove,
      }));
    }
  };

  const handlePieceClick = (piece: PieceProps) => {
    handleCellClick(piece.position);
  };

  // ── Cell colour logic ─────────────────────────────────────────────────────
  const getCellStyle = (cellId: string) => {
    // Dark green — locked pending move (first click, waiting for confirm)
    if (cellId === boardState.pendingMove) {
      return { fill: "#16a34a", fillOpacity: 1, stroke: "#14532d", strokeWidth: 6 };
    }

    // Selected piece — yellow
    if (cellId === boardState.selectedCell) {
      return { fill: "#FFD700", fillOpacity: 1, stroke: "#000", strokeWidth: 6 };
    }

    // Light green — hovering a legal square
    if (cellId === boardState.hoveredMove) {
      return { fill: "#4ade80", fillOpacity: 1, stroke: "#16a34a", strokeWidth: 5 };
    }

    // Yellow-ish tint — available legal moves
    if (boardState.legalMoves.includes(cellId)) {
      return { fill: "#ebe850", fillOpacity: 1, stroke: "#000", strokeWidth: 3 };
    }

    return {
      fill: CONCENTRIC_GRAPH.color[cellId] === "dark" ? "#473c39" : "#f3f1f1",
      fillOpacity: 1,
      stroke: "#000000",
      strokeWidth: 4,
    };
  };

  return (
    <>
      <svg
        viewBox="0 0 1730 1730"
        className="absolute w-[900px] h-[900px]"
      >
        {spaces.map((s) => {
          const style = getCellStyle(s.id);
          const isLegal = boardState.legalMoves.includes(s.id);
          const hasPendingMove = !!boardState.pendingMove;

          return (
            <path
              key={s.id}
              id={s.id}
              d={s.d}
              fill={style.fill}
              fillOpacity={style.fillOpacity}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeOpacity={0}
              style={{ cursor: isLegal || boardState.pieces.some(p => p.position === s.id) ? "pointer" : "default" }}
              onClick={() => handleCellClick(s.id)}
              onMouseEnter={(e) => {
                handleCellHover(s.id, true);

                // Generic hover glow for non-selected, non-legal cells
                if (!boardState.selectedPiece && !isLegal && s.id !== boardState.selectedCell) {
                  e.currentTarget.setAttribute("fill", "#f533e5ff");
                }
              }}
              onMouseLeave={(e) => {
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
      </svg>

      {piecesReady &&
        boardState.pieces.map((piece, idx) => {
          const center = getCellCenter(piece.position);
          return (
            <Piece
              key={`${piece.type}-${piece.color}-${idx}`}
              {...piece}
              x={center.x}
              y={center.y}
              onClick={() => handlePieceClick(piece)}
              isSelected={boardState.selectedPiece === piece}
            />
          );
        })}
    </>
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
  );
}
