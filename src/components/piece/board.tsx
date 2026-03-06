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

type Space = {
  id: string;
  d: string;
};

export type CapturedPiece = {
  type: string;
  color: string;
};

type BoardState = {
  pieces: PieceProps[];
  selectedPiece: PieceProps | null;
  selectedCell: string | null;
  legalMoves: string[];
  hoveredMove: string | null;
  pendingMove: string | null;
  capturedPieces: CapturedPiece[];
};

// Recompute from scratch every time — no stale state bugs
function computeCaptured(currentPieces: PieceProps[]): CapturedPiece[] {
  const currentCounts = new Map<string, number>();
  for (const p of currentPieces) {
    const key = `${p.type}|${p.color}`;
    currentCounts.set(key, (currentCounts.get(key) ?? 0) + 1);
  }

  const initialCounts = new Map<string, number>();
  for (const p of initialPieces as PieceProps[]) {
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
  onCapturedPiecesChange,
  trackCapturedPieces = true,
  isReplayMode = false,
}: {
  moves: Move[];
  onMove: (from: string, to: string) => void;
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
    const newPieces = computePieceState(moves);
    const newCaptured = trackCapturedPieces ? computeCaptured(newPieces) : boardState.capturedPieces;

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
    fetch("/cc/ccboard.svg")
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
    if (isReplayMode) return;

    if (boardState.pendingMove === cellId && boardState.selectedPiece) {
      onMove(boardState.selectedPiece.position, cellId);
      // moves useEffect will clear state when new move arrives
      return;
    }

    if (boardState.selectedPiece && boardState.legalMoves.includes(cellId)) {
      setBoardState((prev) => ({ ...prev, pendingMove: cellId, hoveredMove: null }));
      return;
    }

    const pieceAtCell = boardState.pieces.find((p) => p.position === cellId);

    if (pieceAtCell) {
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
        hoveredMove: entering ? cellId : prev.hoveredMove === cellId ? null : prev.hoveredMove,
      }));
    }
  };

  const getCellStyle = (cellId: string) => {
    if (cellId === boardState.pendingMove)
      return { fill: "#16a34a", fillOpacity: 0.75, stroke: "#14532d", strokeWidth: 6 };
    if (cellId === boardState.selectedCell)
      return { fill: "#FFD700", fillOpacity: 0.75, stroke: "#000", strokeWidth: 6 };
    if (cellId === boardState.hoveredMove)
      return { fill: "#4ade80", fillOpacity: 0.75, stroke: "#16a34a", strokeWidth: 5 };
    if (boardState.legalMoves.includes(cellId))
      return { fill: "#ebe850", fillOpacity: 0.65, stroke: "#000", strokeWidth: 3 };
    return { fill: "transparent", fillOpacity: 0, stroke: "black", strokeWidth: 10 };
  };

  return (
    <>
      <svg
        viewBox="0 0 1730 1730"
        className="absolute top-[-1px] left-[0px] w-[900px] h-[900px]"
      >
        {spaces.map((s) => {
          const style = getCellStyle(s.id);
          const isLegal = boardState.legalMoves.includes(s.id);
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
              style={{
                cursor: isReplayMode
                  ? "default"
                  : isLegal || boardState.pieces.some((p) => p.position === s.id)
                    ? "pointer"
                    : "default",
              }}
              onClick={() => handleCellClick(s.id)}
              onMouseEnter={(e) => {
                if (isReplayMode) return;
                handleCellHover(s.id, true);
                if (!boardState.selectedPiece && !isLegal && s.id !== boardState.selectedCell) {
                  e.currentTarget.setAttribute("fill", "#f533e5ff");
                  e.currentTarget.setAttribute("fill-opacity", "1");
                }
              }}
              onMouseLeave={(e) => {
                if (isReplayMode) return;
                handleCellHover(s.id, false);
                if (!boardState.selectedPiece && !isLegal && s.id !== boardState.selectedCell) {
                  e.currentTarget.setAttribute("fill", "transparent");
                  e.currentTarget.setAttribute("fill-opacity", "0");
                }
              }}
            />
          );
        })}
      </svg>

      {piecesReady &&
        boardState.pieces.map((piece) => {
          const center = getCellCenter(piece.position);
          return (
            <Piece
              key={`${piece.position}-${piece.type}-${piece.color}`}
              {...piece}
              x={center.x}
              y={center.y}
              onClick={() => handleCellClick(piece.position)}
              isSelected={boardState.selectedPiece === piece}
            />
          );
        })}
    </>
  );
}