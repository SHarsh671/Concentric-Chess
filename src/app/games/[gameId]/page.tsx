import { db } from "@/lib/db";
import Game from "./inner";
import { getSession } from "@/lib/auth";
import { playersTable } from "shared/schema";
import { inArray } from "drizzle-orm";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = await db().query.gamesTable.findFirst({
    where: (gamesTable, { eq }) => eq(gamesTable.id, gameId),
  });
  if (!game) {
    return <div className="p-4">Game not found</div>;
  }
  const moves = await db().query.movesTable.findMany({
    where: (movesTable, { eq }) => eq(movesTable.gameId, game.id),
    orderBy: (movesTable, { asc }) => [asc(movesTable.moveNumber)],
  });
  const session = await getSession();

  const playerIds = [game.whitePlayerId, game.blackPlayerId].filter(
    Boolean,
  ) as string[];
  const players =
    playerIds.length > 0
      ? await db()
          .select({ id: playersTable.id, username: playersTable.username })
          .from(playersTable)
          .where(inArray(playersTable.id, playerIds))
      : [];
  const whiteUsername =
    players.find((p) => p.id === game.whitePlayerId)?.username ?? null;
  const blackUsername =
    players.find((p) => p.id === game.blackPlayerId)?.username ?? null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Game
        game={game}
        moves={moves}
        playerId={session?.playerId}
        whiteUsername={whiteUsername}
        blackUsername={blackUsername}
      />
    </div>
  );
}
