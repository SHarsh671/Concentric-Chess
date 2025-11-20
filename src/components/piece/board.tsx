"use client";

import { useEffect, useState } from "react";
import Piece, { PieceProps } from "./piece";

type Space = {
  id: string;
  d: string;
};

type BoardState = {
  pieces: PieceProps[];
  selectedPiece: PieceProps | null;
  selectedCell: string | null;
  legalMoves: string[];
};

export default function Board() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [boardState, setBoardState] = useState<BoardState>({
    pieces: [],
    selectedPiece: null,
    selectedCell: null,
    legalMoves: [],
  });
  const [piecesReady, setPiecesReady] = useState(false);

  // Parse SVG paths on mount
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

  // Initialize pieces after spaces are loaded and rendered
  useEffect(() => {
    if (spaces.length > 0 && !piecesReady) {
      setTimeout(() => {
        const initialPieces: PieceProps[] = [
          // White pieces
          { type: "rook", color: "wht", position: "r1c1" },
          { type: "queen", color: "wht", position: "r2c1" },
          { type: "rook", color: "wht", position: "r2c2" },
          { type: "king", color: "wht", position: "r2c3" },
          { type: "knight", color: "wht", position: "r3c1" },
          { type: "bishop", color: "wht", position: "r3c2" },
          { type: "prince", color: "wht", position: "r3c3" },
          { type: "bishop", color: "wht", position: "r3c4" },
          { type: "knight", color: "wht", position: "r3c5" },
          { type: "pawn", color: "wht", position: "r4c1" },
          { type: "pawn", color: "wht", position: "r4c2" },
          { type: "pawn", color: "wht", position: "r4c3" },
          { type: "pawn", color: "wht", position: "r4c4" },
          { type: "pawn", color: "wht", position: "r4c5" },
          { type: "pawn", color: "wht", position: "r4c6" },
          { type: "pawn", color: "wht", position: "r4c7" },
          //black
          { type: "rook", color: "blk", position: "r12c1" },
          { type: "queen", color: "blk", position: "r11c1" },
          { type: "rook", color: "blk", position: "r11c2" },
          { type: "king", color: "blk", position: "r11c3" },
          { type: "knight", color: "blk", position: "r10c1" },
          { type: "bishop", color: "blk", position: "r10c2" },
          { type: "prince", color: "blk", position: "r10c3" },
          { type: "bishop", color: "blk", position: "r10c4" },
          { type: "knight", color: "blk", position: "r10c5" },
          { type: "pawn", color: "blk", position: "r9c1" },
          { type: "pawn", color: "blk", position: "r9c2" },
          { type: "pawn", color: "blk", position: "r9c3" },
          { type: "pawn", color: "blk", position: "r9c4" },
          { type: "pawn", color: "blk", position: "r9c5" },
          { type: "pawn", color: "blk", position: "r9c6" },
          { type: "pawn", color: "blk", position: "r9c7" },
        ];
        setBoardState((prev) => ({ ...prev, pieces: initialPieces }));
        setPiecesReady(true);
      }, 100);
    }
  }, [spaces, piecesReady]);

  // Get cell center coordinates for piece positioning
  const getCellCenter = (cellId: string): { x: number; y: number } => {
    const space = spaces.find((s) => s.id === cellId);
    if (!space) return { x: 0, y: 0 };

    // Parse the path data to get approximate center
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

  // Calculate legal moves for selected piece
  const calculateLegalMoves = (piece: PieceProps): string[] => {
    // TODO: Implement actual chess rules for concentric board but rn im just returning some dummy adjacent cells for testing (everyone is a king ig)
    const row = parseInt(piece.position.match(/r(\d+)/)?.[1] || "0");
    const col = parseInt(piece.position.match(/c(\d+)/)?.[1] || "0");

    const potentialMoves: string[] = [];
    // Example: allow moving to adjacent cells (simplified)
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r > 0 && c > 0 && !(r === row && c === col)) {
          potentialMoves.push(`r${r}c${c}`);
        }
      }
    }

    // Filter to only include cells that exist and don't have friendly pieces
    return potentialMoves.filter(
      (cellId) =>
        spaces.some((s) => s.id === cellId) &&
        !boardState.pieces.some(
          (p) => p.position === cellId && p.color === piece.color,
        ),
    );
  };

  // Handle cell click
  const handleCellClick = (cellId: string) => {
    console.log("Cell clicked:", cellId);

    // If a piece is selected and this is a legal move, move the piece
    if (boardState.selectedPiece && boardState.legalMoves.includes(cellId)) {
      movePiece(boardState.selectedPiece, cellId);
      return;
    }

    // Check if clicked cell has a piece
    const pieceAtCell = boardState.pieces.find((p) => p.position === cellId);

    if (pieceAtCell && pieceAtCell !== boardState.selectedPiece) {
      // Select this piece
      const legalMoves = calculateLegalMoves(pieceAtCell);
      setBoardState((prev) => ({
        ...prev,
        selectedPiece: pieceAtCell,
        selectedCell: cellId,
        legalMoves,
      }));
      console.log("Piece selected:", pieceAtCell, "Legal moves:", legalMoves);
    } else {
      // Deselect if clicking empty cell
      setBoardState((prev) => ({
        ...prev,
        selectedPiece: null,
        selectedCell: null,
        legalMoves: [],
      }));
    }
  };

  // Handle piece click (delegates to cell click)
  const handlePieceClick = (piece: PieceProps) => {
    handleCellClick(piece.position);
  };

  // Move piece to new position
  const movePiece = (piece: PieceProps, targetCell: string) => {
    console.log("Moving piece", piece, "to", targetCell);

    setBoardState((prev) => ({
      ...prev,
      pieces: prev.pieces
        .map((p) =>
          p === piece
            ? { ...p, position: targetCell }
            : p.position === targetCell
              ? { ...p, position: "" } // Capture piece
              : p,
        )
        .filter((p) => p.position !== ""), // Remove captured pieces
      selectedPiece: null,
      selectedCell: null,
      legalMoves: [],
    }));

    // TODO: Send move to server
  };

  // Get fill color and stroke for cells
  const getCellStyle = (
    cellId: string,
  ): {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
  } => {
    if (cellId === boardState.selectedCell) {
      return {
        fill: "#FFD700", // yellow
        fillOpacity: 0.7,
        stroke: "#000000", // black border
        strokeWidth: 6,
      };
    }
    if (boardState.legalMoves.includes(cellId)) {
      return {
        fill: "#00FF00", //   green
        fillOpacity: 0.45, //
        stroke: "#000000", // black border
        strokeWidth: 6,
      };
    }
    return {
      fill: "transparent",
      fillOpacity: 0,
      stroke: "black",
      strokeWidth: 10,
    };
  };

  return (
    <>
      {/* SVG Board with clickable cells */}
      <svg
        viewBox="0 0 1730 1730"
        className="absolute top-[-1px] left-[0px] w-[1700px] h-[1700px]"
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
              strokeOpacity={0} //was 0.8
              style={{ cursor: "pointer" }}
              onClick={() => handleCellClick(s.id)}
              onMouseEnter={(e) => {
                if (
                  !boardState.selectedPiece &&
                  !boardState.legalMoves.includes(s.id)
                ) {
                  e.currentTarget.setAttribute("fill", "#f533e5ff");
                  e.currentTarget.setAttribute("fill-opacity", "1");
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !boardState.selectedPiece &&
                  !boardState.legalMoves.includes(s.id)
                ) {
                  e.currentTarget.setAttribute("fill", "transparent");
                  e.currentTarget.setAttribute("fill-opacity", "0");
                }
              }}
            />
          );
        })}
      </svg>

      {/* Render pieces */}
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

  // return (
  //     <div className="absolute top-0 left-0 w-full h-full">
  // {/* SVG Board with clickable cells */}
  // <svg
  //     viewBox="0 0 1710 1710"
  //     className="absolute top-[-10px] left-[-7px] w-[1700px] h-[1700px]"
  // >
  //     {spaces.map(s => {
  //         const style = getCellStyle(s.id);
  //         return (
  //             <path
  //                 key={s.id}
  //                 id={s.id}
  //                 d={s.d}
  //                 fill={style.fill}
  //                 fillOpacity={style.fillOpacity}
  //                 stroke={style.stroke}
  //                 strokeWidth={style.strokeWidth}
  //                 strokeOpacity={0.8}
  //                 style={{ cursor: 'pointer' }}
  //                 onClick={() => handleCellClick(s.id)}
  //                 onMouseEnter={(e) => {
  //                     if (!boardState.selectedPiece && !boardState.legalMoves.includes(s.id)) {
  //                         e.currentTarget.setAttribute('fill', '#f533e5ff');
  //                         e.currentTarget.setAttribute('fill-opacity', '1');
  //                     }
  //                 }}
  //                 onMouseLeave={(e) => {
  //                     if (!boardState.selectedPiece && !boardState.legalMoves.includes(s.id)) {
  //                         e.currentTarget.setAttribute('fill', 'transparent');
  //                         e.currentTarget.setAttribute('fill-opacity', '0');
  //                     }
  //                 }}
  //             />
  //         );
  //     })}
  // </svg>

  // {/* Render pieces */}
  // {piecesReady && boardState.pieces.map((piece, idx) => {
  //     const center = getCellCenter(piece.position);
  //     return (
  //         <Piece
  //             key={`${piece.type}-${piece.color}-${idx}`}
  //             {...piece}
  //             x={center.x}
  //             y={center.y}
  //             onClick={() => handlePieceClick(piece)}
  //             isSelected={boardState.selectedPiece === piece}
  //         />
  //     );
  // })}
  //     </div>
  // );
}
