"use client";

import { Button } from "@/components/ui/button";
import { GameSocket, useGameSocket } from "@/lib/ws";
import { useEffect, useState } from "react";
import { Game, Move } from "shared";
import "client-only";

export default function GamePage({
  game: initialGame,
  moves: initialMoves,
  playerId,
}: {
  game: Game;
  moves: Move[];
  playerId: string | null;
}) {
  // TODO: need to branch early if the game is deleted or completed (should not connect the websocket)
  const [game, setGame] = useState(initialGame);
  const ws = GameSocket.get();
  const [moves, setMoves] = useState(initialMoves);
  useEffect(() => {
    ws.connect(game.id);
    ws.setListener((message) => {
      switch (message.type) {
        case "move":
          {
            const move = message.data as Move;
            setMoves((prevMoves) => [...prevMoves, move]);
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
  return <>{JSON.stringify(game)}</>;
}
