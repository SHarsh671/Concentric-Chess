"use client";

import { useState } from "react";
import Board, { CapturedPiece } from "@/components/piece/board";
import Image from "next/image";
import RulesDialog from "@/components/piece/rules-dialog";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewMove {
  id: string;
  gameId: string;
  playerId: string;
  fromSquare: string;
  toSquare: string;
  moveNumber: number;
  promotion: null;
  createdAt: string;
}

export default function TestBoardPage() {
  const [moves, setMoves] = useState<NewMove[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [moveCount, setMoveCount] = useState(1);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);

  const handleMove = (from: string, to: string) => {
    const newMove: NewMove = {
      id: `move-${moveCount}`,
      gameId: "test-game",
      playerId: "test-player",
      fromSquare: from,
      toSquare: to,
      moveNumber: moveCount,
      promotion: null,
      createdAt: new Date().toISOString(),
    };
    setMoves((prev) => [...prev, newMove]);
    setMoveCount((prev) => prev + 1);
  };

  // Separate captured pieces by color
  const whiteCaptured = capturedPieces.filter((p) => p.color === "wht");
  const blackCaptured = capturedPieces.filter((p) => p.color === "blk");    

  return (
    <div className="flex w-full gap-4 p-4">
      {/* Left sidebar: Captured Pieces */}
      <div className="w-[140px] border-4 border-black bg-white rounded-lg p-3 flex flex-col h-[900px] shrink-0">
        <div className="text-sm font-bold mb-3 uppercase text-center border-b-2 border-black pb-2">
          Captured<br/>Pieces
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* White captured */}
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1 text-center">White ♔</div>
            <div className="flex flex-col gap-1 items-center">
              {whiteCaptured.length === 0 ? (
                <span className="text-xs text-gray-400 italic">None</span>
              ) : (
                whiteCaptured.map((piece, idx) => (
                  <div
                    key={`white-${piece.type}-${idx}`}
                    className="animate-slide-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <img
                      src={`/pieces/${piece.type}-${piece.color}.png`}
                      alt={`${piece.color} ${piece.type}`}
                      className="w-14 h-14 opacity-80"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-gray-300"></div>

          {/* Black captured */}
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1 text-center">Black ♚</div>
            <div className="flex flex-col gap-1 items-center">
              {blackCaptured.length === 0 ? (
                <span className="text-xs text-gray-400 italic">None</span>
              ) : (
                blackCaptured.map((piece, idx) => (
                  <div
                    key={`black-${piece.type}-${idx}`}
                    className="animate-slide-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <img
                      src={`/pieces/${piece.type}-${piece.color}.png`}
                      alt={`${piece.color} ${piece.type}`}
                      className="w-14 h-14 opacity-80"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main board */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full max-w-[900px]">
          <div className="text-lg font-semibold">
            Testing Concentric Chess — Move #{moveCount}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowRules(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <HelpCircle size={18} />
              Rules
            </Button>
          </div>
        </div>

        <div className="relative w-[900px] h-[900px] border-2 shadow-lg">
          <Image
            src="/cc/ccboard.png"
            alt="Chess board"
            width={900}
            height={900}
            className="absolute top-0 left-0"
            priority
          />
          <div className="absolute top-0 left-0 w-full h-full">
            <Board
              moves={moves}
              onMove={handleMove}
              onCapturedPiecesChange={setCapturedPieces}
            />
          </div>
        </div>

        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 max-w-[900px] text-sm text-gray-700">
          <p className="font-semibold mb-2">♟ How to move:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click a piece — available squares highlight yellow</li>
            <li>Hover a destination — turns light green</li>
            <li>Click to lock — turns dark green</li>
            <li>Click again to confirm</li>
          </ol>
        </div>
      </div>

      {/* Move history + controls */}
      <div className="w-[260px] border-2 flex flex-col shrink-0">
        <div className="flex-1 p-3 border-b overflow-y-auto">
          <p className="font-semibold mb-2 text-sm">Move History:</p>
          {moves.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No moves yet</p>
          ) : (
            moves.map((move, idx) => {
              const turn = Math.floor(idx / 2) + 1;
              const mover = idx % 2 === 0 ? "w" : "b";
              return (
                <div key={idx} className="text-sm px-2 py-1 hover:bg-gray-100">
                  {turn}{mover}. {move.fromSquare} → {move.toSquare}
                </div>
              );
            })
          )}
        </div>
        <div className="p-3 bg-blue-50 border-t border-blue-200">
          <p className="font-semibold mb-2 text-sm">-</p>
          <Button
            onClick={() => {
              setMoves([]);
              setMoveCount(1);
              setCapturedPieces([]);
            }}
            variant="outline"
            className="w-full border-black-400 text-black-600 hover:bg-gray-100"
          >
            Reset Board
          </Button>
        </div>
      </div>

      <RulesDialog isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}