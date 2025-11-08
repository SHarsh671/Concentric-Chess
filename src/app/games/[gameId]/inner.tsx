"use client";

import { useGameSocket } from "@/lib/ws";
import { useEffect, useState } from "react";
import { Game, Move } from "shared";

export default function GamePage({
  game: initialGame,
  moves: initialMoves,
}: {
  game: Game;
  moves: Move[];
}) {
  // TODO: need to branch early if the game is deleted or completed (should not connect the websocket)
  const [game, setGame] = useState(initialGame);
  const ws = useGameSocket(game.id);
  const [moves, setMoves] = useState(initialMoves);
  useEffect(() => {
    ws.setListener((message) => {
      switch (message.type) {
        case "move":
          {
            const move = message.data as Move;
            setMoves((prevMoves) => [...prevMoves, move]);
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
  }, []);
  return <>Game Page</>;
}
