import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import GameReplayClient from "./client";

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  // Fetch the game
  const game = await db().query.gamesTable.findFirst({
    where: (gamesTable, { eq }) => eq(gamesTable.id, gameId),
  });

  if (!game) {
    notFound();
  }

  // Fetch all moves for this game
  const moves = await db().query.movesTable.findMany({
    where: (movesTable, { eq }) => eq(movesTable.gameId, game.id),
    orderBy: (movesTable, { asc }) => [asc(movesTable.moveNumber)],
  });

  // Fetch player information
  const whitePlayer = await db().query.playersTable.findFirst({
    where: (p, { eq }) => eq(p.id, game.whitePlayerId!),
  });

  const blackPlayer = await db().query.playersTable.findFirst({
    where: (p, { eq }) => eq(p.id, game.blackPlayerId!),
  });

  return (
    <GameReplayClient
      game={game}
      moves={moves}
      whiteUsername={whitePlayer?.username ?? "Unknown"}
      blackUsername={blackPlayer?.username ?? "Unknown"}
    />
  );
}
