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
  pendingMove: string | null; // The destination cell waiting for confirmation
};

export default function Board({
  moves,
  onMove,
  viewerSide,
  currentTurn,
  isSpectator,
  canControlBoth,
}: {
  moves: Move[];
  onMove: (from: string, to: string) => void;
  viewerSide: Side | undefined;    // "white" | "black" | undefined
  currentTurn: Side;               // whose turn it is
  isSpectator: boolean;
  canControlBoth: boolean;
}) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [boardState, setBoardState] = useState<BoardState>({
    pieces: JSON.parse(JSON.stringify(initialPieces)),
    selectedPiece: null,
    selectedCell: null,
    legalMoves: [],
    pendingMove: null,
  });
  const [piecesReady, setPiecesReady] = useState(false);

  useEffect(() => {
    console.log("Moves received:", moves);
    setPiecesReady(true);
    setBoardState((prev) => {
      const updatedPieces: PieceProps[] = computePieceState(moves);
      return { ...prev, pieces: updatedPieces };
    });
  }, [moves]);

  useEffect(() => {
    fetch("/cc/ccboard.svg")
      .then((res) => res.text())
      .then((svgText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const pathNodes = Array.from(doc.querySelectorAll("path"));

        const extracted = pathNodes.map((node) => ({
          id: node.id || crypto.randomUUID(),
          d: node.getAttribute("d") || "",
        }));

        setSpaces(extracted);
      });
  }, []);

  const getCellCenter = (cellId: string): { x: number; y: number } => {
    const space = spaces.find((s) => s.id === cellId);
    if (!space) return { x: 0, y: 0 };

    if (typeof window !== "undefined") {
      const pathElement = document.getElementById(
        cellId,
      ) as SVGPathElement | null;
      if (pathElement && pathElement.getBBox) {
        try {
          const bbox = pathElement.getBBox();
          return {
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2,
          };
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
    if (isSpectator) return;
    if (!canControlBoth && viewerSide !== currentTurn) {
      return;
    }

    console.log("Cell clicked:", cellId);

    // If there's a pending move and clicking the same cell, confirm the move
    if (boardState.pendingMove === cellId && boardState.selectedPiece) {
      onMove(boardState.selectedPiece.position, cellId);
      setBoardState((prev) => ({
        ...prev,
        selectedPiece: null,
        selectedCell: null,
        legalMoves: [],
        pendingMove: null,
      }));
      return;
    }

    // If a piece is selected and this is a legal move, set as pending
    if (boardState.selectedPiece && boardState.legalMoves.includes(cellId)) {
      setBoardState((prev) => ({
        ...prev,
        pendingMove: cellId,
      }));
      return;
    }

    // Check if clicked cell has a piece
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
          pendingMove: null,
        }));
      } else {
        // Select this piece
        const legalMoves = calculateLegalMoves(pieceAtCell);
        setBoardState((prev) => ({
          ...prev,
          selectedPiece: pieceAtCell,
          selectedCell: cellId,
          legalMoves,
          pendingMove: null,
        }));
        console.log("Piece selected:", pieceAtCell, "Legal moves:", legalMoves);
      }
    } else {
      // Clicking empty non-legal cell deselects everything
      setBoardState((prev) => ({
        ...prev,
        selectedPiece: null,
        selectedCell: null,
        legalMoves: [],
        pendingMove: null,
      }));
    }
  };

  const handlePieceClick = (piece: PieceProps) => {
    if (isSpectator) return;
    if (viewerSide !== currentTurn) return;
    if (piece.color !== viewerSide) return;

    handleCellClick(piece.position);
  };

  const getCellStyle = (
    cellId: string,
  ): {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
  } => {
    // Pending move highlight (green for confirmation)
    if (cellId === boardState.pendingMove) {
      return {
        fill: "#00FF00",
        fillOpacity: 1,
        stroke: "#00CC00",
        strokeWidth: 6,
      };
    }

    // Selected piece highlight (yellow)
    if (cellId === boardState.selectedCell) {
      return {
        fill: "#FFD700",
        fillOpacity: 1,
        stroke: "#000000",
        strokeWidth: 6,
      };
    }

    // Legal moves highlight (light blue)
    if (boardState.legalMoves.includes(cellId)) {
      return {
        fill: "#ebe850",
        fillOpacity: 1,
        stroke: "#000000",
        strokeWidth: 4,
      };
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
        className="absolute top-[-1px] left-[0px] w-[900px] h-[900px]"
      >
        {spaces.map((s) => {
          const style = getCellStyle(s.id);
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
              style={{ cursor: "pointer" }}
              onClick={() => handleCellClick(s.id)}
              onMouseEnter={(e) => {
                if (
                  !boardState.selectedPiece &&
                  !boardState.legalMoves.includes(s.id)
                ) {
                  e.currentTarget.setAttribute("fill", "#f533e5ff");
                }
              }}
              onMouseLeave={(e) => {
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
  );
  // {spaces.map((s) => {
  //   return (
  //     <span
  //       key={s.id}
  //       className={`size-piece ${s.id}`}
  //       style={{
  //         position: "absolute",
  //         // fontSize: "10px",
  //         transform: "translate(20%, 30%)",
  //         fontWeight: "bold",
  //         pointerEvents: "none",
  //         color: "#fff",
  //       }}
  //     >
  //       {toNotation(s.id) || s.id}
  //     </span>
  //   );
  // })}
}
