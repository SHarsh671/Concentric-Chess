"use client";

import { Button } from "@/components/ui/button";
import { GameSocket } from "@/lib/ws";
import { useEffect, useState } from "react";
import { Game, Move } from "shared";
import "client-only";
import Board from "@/components/piece/board";
import Image from "next/image";
import RulesDialog from "@/components/piece/rules-dialog";
import { HelpCircle } from "lucide-react";

export default function GamePage({
  game: initialGame,
  moves: initialMoves,
  playerId,
}: {
  game: Game;
  moves: Move[];
  playerId: string | undefined;
}) {
  const [game, setGame] = useState(initialGame);
  const ws = GameSocket.get();
  const [moves, setMoves] = useState(initialMoves);
  const [showRules, setShowRules] = useState(false);
  
  const onMove = (from: string, to: string) => {
    console.log("Sending move:", { from, to });
    ws.send({
      type: "move",
      data: {
        side: game.nextMove % 2 === 1 ? "white" : "black",
        from: from,
        to: to,
      },
    });
  };
  
  useEffect(() => {
    ws.connect(game.id);
    ws.setListener((message) => {
      switch (message.type) {
        case "move":
          {
            const move = message.data as Move;
            setMoves((prevMoves) => [...prevMoves, move]);
            setGame((prevGame) => ({
              ...prevGame,
              nextMove: move.moveNumber + 1,
              lastMoveAt: new Date().toISOString(),
            }));
          }
          break;
        case "aborted":
          {
            setGame((prevGame) => ({
              ...prevGame,
              status: "aborted",
              deletedAt: new Date().toISOString(),
            }));
          }
          break;
        case "accepted":
          {
            setGame((prevGame) => {
              return {
                ...prevGame,
                whitePlayerId: message.data.whitePlayerId,
                blackPlayerId: message.data.blackPlayerId,
                whiteAccepted: 1,
                blackAccepted: 1,
              };
            });
          }
          break;
        case "game_over":
          {
            setGame((prevGame) => ({
              ...prevGame,
              status: message.data.result,
            }));
          }
          break;
      }
    });
    return () => {
      ws.setListener(null);
      ws.disconnect();
    };
  }, [game.id]);
  
  if (!game) {
    return <>Game not found</>;
  }
  if (game.status === "aborted") {
    return <>Game aborted</>;
  }
  if (game.deletedAt) {
    return <>Game not found</>;
  }
  if (game.blackPlayerId === playerId && game.blackAccepted === 0) {
    return (
      <Button onClick={() => ws.send({ type: "accept" })}>Accept Game</Button>
    );
  }
  if (game.whitePlayerId === playerId && game.whiteAccepted === 0) {
    return (
      <Button onClick={() => ws.send({ type: "accept" })}>Accept Game</Button>
    );
  }
  if (game.whiteAccepted === 0 || game.blackAccepted === 0) {
    return <>Waiting for opponent to accept the game...</>;
  }
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[900px]">
        <div className="text-lg">
          You are{" "}
          {game.whitePlayerId === playerId && game.blackPlayerId === playerId
            ? "both players?"
            : game.whitePlayerId === playerId
              ? "White"
              : game.blackPlayerId === playerId
                ? "Black"
                : "a spectator"}
          . It is {game.nextMove % 2 === 1 ? "White's" : "Black's"} turn.
        </div>
        
        <Button
          onClick={() => setShowRules(true)}
          variant="outline"
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-700"
        >
          <HelpCircle size={20} />
          Rules
        </Button>
      </div>

      <div className="relative w-[900px] h-[900px] border-2">
        <Image
          src="/cc/ccboard.png"
          alt="Chess board"
          width={900}
          height={900}
          className="absolute top-0 left-0"
          priority
        />

        <div className="absolute top-0 left-0 w-full h-full">
          <Board moves={moves} onMove={onMove} />
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 max-w-[900px] text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 How to move:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click a piece to select it (yellow highlight)</li>
          <li>Click a legal destination cell (blue highlight)</li>
          <li>Click the destination again (green highlight) to confirm the move</li>
        </ol>
      </div>

      <RulesDialog isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}