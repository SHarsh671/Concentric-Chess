import { db } from "@/lib/db";
import Game from "./inner";
import { getSession } from "@/lib/auth";

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

  return (
    <div className="flex p-4">
      <Game game={game} moves={moves} playerId={session?.playerId} />
    </div>
  );
}
