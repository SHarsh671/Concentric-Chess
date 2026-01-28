"use client";

import { Button } from "@/components/ui/button";
import { GameSocket } from "@/lib/ws";
import { useEffect, useRef, useState } from "react";
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
    gameRef.current = game;
  }, [game]);
  useEffect(() => {
    ws.connect(game.id);
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
              setMoves((prevMoves) => {
                return [...prevMoves, move];
              });
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
        case "sync": {
          setGame(message.data.game);
          setMoves(message.data.moves);
          break;
        }
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
          // White to move
          setTimer([
            game.whiteTimeLeft !== null
              ? Math.max(0, game.whiteTimeLeft - timeSinceLastMove)
              : null,
            game.blackTimeLeft,
          ]);
        } else {
          // Black to move
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
    <>
      {game.status === "white_win" && <div>White wins!</div>}
      {game.status === "black_win" && <div>Black wins!</div>}
      {game.status === "draw" && <div>Draw!</div>}
      {game.status === "white_resign" && <div>White resigns. Black wins!</div>}
      {game.status === "black_resign" && <div>Black resigns. White wins!</div>}
      You are{" "}
      {game.whitePlayerId === playerId && game.blackPlayerId === playerId
        ? "both players?"
        : game.whitePlayerId === playerId
          ? "White"
          : game.blackPlayerId === playerId
            ? "Black"
            : "a spectator"}
      . It is {game.nextMove % 2 === 1 ? "White's" : "Black's"} turn.
      <br />
      <div>
        White time left: <Timer timeLeft={timer[0]} /> | Black time left:{" "}
        <Timer timeLeft={timer[1]} />
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

// should be a pretty HTML thing showing minutes:seconds or "unlimited"
function Timer({ timeLeft }: { timeLeft: number | null }) {
  if (timeLeft === null) {
    return "unlimited";
  }
  const seconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return (
    <div className="inline-block w-16 text-center">
      {minutes}:{remainingSeconds.toString().padStart(2, "0")}
    </div>
  );
}
