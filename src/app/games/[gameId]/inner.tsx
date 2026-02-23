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

  const groupedMoves: Record<number, { w?: typeof moves[0]; b?: typeof moves[0] }> = {};

  moves.forEach((m) => {
    const turn = Math.floor((m.moveNumber - 1) / 2) + 1;
    const mover = m.moveNumber % 2 === 1 ? "w" : "b";

    if (!groupedMoves[turn]) groupedMoves[turn] = {};
    groupedMoves[turn][mover] = m;
  });

  const sortedTurns = Object.keys(groupedMoves)
    .map(Number)
    .sort((a, b) => b - a);

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
              setMoves((prevMoves) => {
                return [...prevMoves, move];
              });
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
          {
            console.log("Game aborted");
            setGame((prevGame) => ({
              ...prevGame,
              status: "aborted",
              deletedAt: new Date().toISOString(),
            }));
          }
          break;
        case "accepted":
          {
            console.log("Game accepted");
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
            console.log("Game over:", message.data.result);
            setGame((prevGame) => ({
              ...prevGame,
              status: message.data.result,
            }));
          }
          break;
        case "sync": {
          console.log("Syncing game state");
          setGame(message.data.game);
          setMoves(message.data.moves);
          break;
        }
        case "draw_offer": {
          console.log("Draw offer updated");
          setGame((game) => ({ ...game, ...message.data }));
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
          {/* Background board image */}
          <Image
            src="/cc/ccboard.png"
            alt="Chess board"
            width={900}
            height={900}
            className="absolute top-0 left-0"
            priority
          />

          {/* Overlay: SVG cells + pieces */}
          <div className="absolute top-0 left-0 w-full h-full">
            <Board moves={moves} onMove={onMove} />
          </div>
        </div>
      </div>
      {/* game sidebar */}
      <div className="relative w-[30%] h-[70%] left-1/36 border-2 mt-[24px]">
        <div className="flex w-full h-1/5">
          <div className="relative w-1/3 h-1/2 top-1/4 left-1/18 border-gray-400 border-2 rounded-2xl bg-gray-200 text-center text-[37px] text-black"><Timer timeLeft={timer[0]}></Timer></div>
          <div className="relative w-1/3 h-1/2 top-1/4 left-5/18 border-gray-800 border-2 rounded-2xl bg-gray-600 text-center text-[37px] text-white"><Timer timeLeft={timer[1]}></Timer></div>
        </div>
        <div className="relative flex flex-col w-18/20 mx-auto h-3/5 border-2 rounded-md overflow-y-auto">
          {sortedTurns.map((turn) => {
            const move = groupedMoves[turn];

            return (
              <div
                key={turn}
                className="grid grid-cols-[40px_1fr_1fr] items-center px-2 py-1 hover:bg-muted/40"
              >
                <span className="font-semibold">{turn}.</span>

                <span>
                  {move.w && `${move.w.fromSquare}-${move.w.toSquare}`}
                </span>

                <span>
                  {move.b && `${move.b.fromSquare}-${move.b.toSquare}`}
                </span>
              </div>
            );
          })}
        </div>
        {/* TODO: i assume the schema for the draw/resign is incomplete and needs to be finished */}
        <div className="flex w-full h-1/5">
          <Button className="relative w-2/5 h-1/2 top-1/3 left-1/15 border-orange-400 border-2 rounded-2xl bg-orange-300 text-center text-xl text-orange-900" onClick={() => ws.send({ type: "draw" })}>Draw</Button>
          <Button className="relative w-2/5 h-1/2 top-1/3 left-4/30 border-orange-400 border-2 rounded-2xl bg-orange-300 text-center text-xl text-orange-900" onClick={() => ws.send({ type: "resign" })}>Resign</Button>
        </div>

        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 max-w-[900px] text-sm text-blue-800 mt-[24px]">
          <p className="font-semibold mb-1">💡 How to move:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click a piece to select it (yellow highlight)</li>
            <li>Click a legal destination cell (blue highlight)</li>
            <li>Click the destination again (green highlight) to confirm the move</li>
          </ol>
        </div>

        <Button
          onClick={() => setShowRules(true)}
          variant="outline"
          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-700 mt-4"
        >
          <HelpCircle size={20} />
          Rules
        </Button>
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
