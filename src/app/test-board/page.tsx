"use client";

import { useState } from "react";
import Board from "@/components/piece/board";
import Image from "next/image";
import RulesDialog from "@/components/piece/rules-dialog";
import SpiralRulesDialog from "@/components/piece/spiral-rules-dialog";
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
  const [showSpiralRules, setShowSpiralRules] = useState(false);
  const [moveCount, setMoveCount] = useState(1);

  const handleMove = (from: string, to: string) => {
    console.log("Move made:", from, "→", to);
    const newMove = {
      id: `move-${moveCount}`,
      gameId: "test-game",
      playerId: "test-player",
      fromSquare: from,
      toSquare: to,
      moveNumber: moveCount,
      promotion: null,
      createdAt: new Date().toISOString(),
    };
    setMoves([...moves, newMove]);
    setMoveCount(moveCount + 1);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex items-center justify-between w-full max-w-[900px]">
        <div className="text-lg font-semibold">
          Testing Concentric Chess - Move #{moveCount}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowRules(true)}
            variant="outline"
            className="flex items-center gap-2 border-gray-800 text-gray-800 hover:bg-gray-100"
          >
            <HelpCircle size={18} />
            Circle Rules
          </Button>
          <Button
            onClick={() => setShowSpiralRules(true)}
            variant="outline"
            className="flex items-center gap-2 border-gray-800 text-gray-800 hover:bg-gray-100"
          >
            <HelpCircle size={18} />
            Spiral Rules
          </Button>
        </div>
      </div>

      <div className="relative w-[900px] h-[900px] border-2 shadow-lg">
        <Image
          src="/as/asboard2.png"
          alt="Chess board"
          width={900}
          height={900}
          className="absolute top-0 left-0"
          priority
        />
        <div className="absolute top-0 left-0 w-full h-full">
          <Board moves={moves} onMove={handleMove} />
        </div>
      </div>

      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 max-w-[900px] text-sm text-gray-700">
        <p className="font-semibold mb-2">♟ How to move:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click a piece — available squares highlight <span className="font-semibold text-yellow-600">yellow</span></li>
          <li>Hover a destination — turns <span className="font-semibold" style={{ color: "#4ade80" }}>light green</span></li>
          <li>Click to lock — turns <span className="font-semibold" style={{ color: "#16a34a" }}>dark green</span></li>
          <li>Click again to confirm the move</li>
        </ol>
      </div>

      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 max-w-[900px] w-full text-sm">
        <p className="font-semibold mb-1">Move History:</p>
        {moves.length === 0 ? (
          <p className="text-gray-500 italic">No moves yet</p>
        ) : (
          <div className="space-y-1">
            {moves.map((move, idx) => (
              <div key={idx}>
                {idx + 1}. {move.fromSquare} → {move.toSquare}
              </div>
            ))}
          </div>
        )}
      </div>

      <RulesDialog isOpen={showRules} onClose={() => setShowRules(false)} />
      <SpiralRulesDialog isOpen={showSpiralRules} onClose={() => setShowSpiralRules(false)} />
    </div>
  );
}