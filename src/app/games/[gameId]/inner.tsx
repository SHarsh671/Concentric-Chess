"use client";

import { Button } from "@/components/ui/button";
import { GameSocket } from "@/lib/ws";
import { useEffect, useRef, useState } from "react";
import { Game, Move } from "shared";
import "client-only";
import Board from "@/components/piece/board";
import Image from "next/image";
import RulesDialog from "@/components/piece/rules-dialog";
import SpiralRulesDialog from "@/components/piece/spiral-rules-dialog";
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
  const [showSpiralRules, setShowSpiralRules] = useState(false);

  const gameRef = useRef(game);
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
    console.log("Game updated:", game);
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    ws.connect(game.id, true);
    ws.setListener((message) => {
      switch (message.type) {
        case "move":
          {
            const move = message.data.move;
            if (move.moveNumber !== gameRef.current.nextMove) {
              console.error(
                `Received move with moveNumber ${move.moveNumber}, but expected ${gameRef.current.nextMove}`,
              );
              ws.send({ type: "sync_request" });
            } else {
              setMoves((prevMoves) => [...prevMoves, move]);
              console.log("Move received:", move);
              setGame((prevGame) => ({
                ...prevGame,
                nextMove: message.data.nextMove,
                lastMoveAt: message.data.lastMoveAt,
                whiteTimeLeft: message.data.whiteTimeLeft,
                blackTimeLeft: message.data.blackTimeLeft,
              }));
            }
          }
          break;
        case "aborted":
          setGame((prevGame) => ({
            ...prevGame,
            status: "aborted",
            deletedAt: new Date().toISOString(),
          }));
          break;
        case "accepted":
          setGame((prevGame) => ({
            ...prevGame,
            whitePlayerId: message.data.whitePlayerId,
            blackPlayerId: message.data.blackPlayerId,
            whiteAccepted: 1,
            blackAccepted: 1,
          }));
          break;
        case "game_over":
          setGame((prevGame) => ({
            ...prevGame,
            status: message.data.result,
          }));
          break;
        case "sync":
          setGame(message.data.game);
          setMoves(message.data.moves);
          break;
        case "draw_offer":
          setGame((game) => ({ ...game, ...message.data }));
          break;
      }
    });
    return () => {
      ws.setListener(null);
      ws.disconnect();
    };
  }, [game.id]);

  const timeSinceLastMove =
    Date.now() - new Date(game.lastMoveAt || game.createdAt!).getTime();
  const [timer, setTimer] = useState([
    game.nextMove % 2 === 1
      ? game.whiteTimeLeft !== null
        ? Math.max(0, game.whiteTimeLeft - timeSinceLastMove)
        : null
      : game.whiteTimeLeft,
    game.nextMove % 2 === 0
      ? game.blackTimeLeft !== null
        ? Math.max(0, game.blackTimeLeft - timeSinceLastMove)
        : null
      : game.blackTimeLeft,
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (game.status === "ongoing") {
      interval = setInterval(() => {
        const timeSinceLastMove =
          Date.now() - new Date(game.lastMoveAt || game.createdAt!).getTime();
        if (game.nextMove % 2 === 1) {
          setTimer([
            game.whiteTimeLeft !== null
              ? Math.max(0, game.whiteTimeLeft - timeSinceLastMove)
              : null,
            game.blackTimeLeft,
          ]);
        } else {
          setTimer([
            game.whiteTimeLeft,
            game.blackTimeLeft !== null
              ? Math.max(0, game.blackTimeLeft - timeSinceLastMove)
              : null,
          ]);
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    game.status,
    game.nextMove,
    game.whiteTimeLeft,
    game.blackTimeLeft,
    game.lastMoveAt,
    game.createdAt,
  ]);

  if (!game) return <>Game not found</>;
  if (game.status === "aborted") return <>Game aborted</>;
  if (game.deletedAt) return <>Game not found</>;
  if (game.blackPlayerId === playerId && game.blackAccepted === 0) {
    return <Button onClick={() => ws.send({ type: "accept" })}>Accept Game</Button>;
  }
  if (game.whitePlayerId === playerId && game.whiteAccepted === 0) {
    return <Button onClick={() => ws.send({ type: "accept" })}>Accept Game</Button>;
  }
  if (game.whiteAccepted === 0 || game.blackAccepted === 0) {
    return <>Waiting for opponent to accept the game...</>;
  }

  return (
    <div className="flex w-full">
      <div className="flex flex-col items-center space-y-4">
        {game.status === "white_win" && <div>White wins!</div>}
        {game.status === "black_win" && <div>Black wins!</div>}
        {game.status === "draw" && <div>Draw!</div>}
        {game.status === "white_resign" && <div>White resigns. Black wins!</div>}
        {game.status === "black_resign" && <div>Black resigns. White wins!</div>}
        You are{" "}
        {game.whitePlayerId === playerId && game.blackPlayerId === playerId
          ? "both players"
          : game.whitePlayerId === playerId
            ? "White"
            : game.blackPlayerId === playerId
              ? "Black"
              : "a spectator"}
        . It is {game.nextMove % 2 === 1 ? "White's" : "Black's"} turn.
        <br />
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
      </div>

      {/* Sidebar */}
      <div className="relative w-[30%] h-[70%] left-1/36 border-2 mt-[24px]">
        {/* Timers */}
        <div className="flex w-full h-1/5">
          <div className="relative w-1/3 h-1/2 top-1/4 left-1/18 border-gray-400 border-2 rounded-2xl bg-gray-200 text-center text-[37px] text-black overflow-auto">
            <Timer timeLeft={timer[0]} />
          </div>
          <div className="relative w-1/3 h-1/2 top-1/4 left-5/18 border-gray-800 border-2 rounded-2xl bg-gray-600 text-center text-[37px] text-white overflow-auto">
            <Timer timeLeft={timer[1]} />
          </div>
        </div>

        {/* Move list */}
        <div className="relative flex flex-col-reverse w-18/20 mx-auto h-3/5 border-2 columns-1 overflow-y-auto">
          {moves.toReversed().map((m) => {
            const turn = Math.floor((m.moveNumber - 1) / 2) + 1;
            const mover = m.moveNumber % 2 === 1 ? "w" : "b";
            return (
              <p key={m.id}>
                {turn}{mover}. {m.fromSquare}-{m.toSquare}
              </p>
            );
          })}
        </div>

        {/* Draw / Resign */}
        <div className="flex w-full h-1/5">
          <Button
            className="relative w-2/5 h-1/2 top-1/4 left-1/15 border-orange-400 border-2 rounded-2xl bg-orange-300 text-center text-5xl text-gray-100 overflow-auto"
            onClick={() => ws.send({ type: "draw" })}
          >
            Draw
          </Button>
          <Button
            className="relative w-2/5 h-1/2 top-1/4 left-4/30 border-orange-400 border-2 rounded-2xl bg-orange-300 text-center text-5xl text-gray-100 overflow-auto"
            onClick={() => ws.send({ type: "resign" })}
          >
            Resign
          </Button>
        </div>

        {/* How to move hint */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 max-w-[900px] text-sm text-gray-700 mt-[24px]">
          <p className="font-semibold mb-1">♟ How to move:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click a piece — available squares highlight <span className="font-semibold text-yellow-600">yellow</span></li>
            <li>Hover a destination — it turns <span className="font-semibold" style={{ color: "#4ade80" }}>light green</span></li>
            <li>Click to lock it — it turns <span className="font-semibold" style={{ color: "#16a34a" }}>dark green</span></li>
            <li>Click again to confirm the move</li>
          </ol>
        </div>

        {/* Rules buttons */}
        <div className="flex gap-2 mt-4">
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

      <RulesDialog isOpen={showRules} onClose={() => setShowRules(false)} />
      <SpiralRulesDialog isOpen={showSpiralRules} onClose={() => setShowSpiralRules(false)} />
    </div>
  );
}

function Timer({ timeLeft }: { timeLeft: number | null }) {
  if (timeLeft === null) return <>unlimited</>;
  const seconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return (
    <div className="inline-block w-16 text-center">
      {minutes}:{remainingSeconds.toString().padStart(2, "0")}
    </div>
  );
}