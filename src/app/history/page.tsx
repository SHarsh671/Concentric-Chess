import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function HistoryPage() {
  // Load session (so we can optionally highlight games involving the current user)
  const session = await getSession();

  // Fetch non-deleted games
  const games = await db().query.gamesTable.findMany({
    where: (gamesTable, { isNull }) => isNull(gamesTable.deletedAt),
    orderBy: (gamesTable, { desc }) => [desc(gamesTable.lastMoveAt)],
  });

  // Define finished as any game whose status is not "ongoing"
  const finishedGames = games.filter((g) => g.status !== "ongoing");

  // For each game fetch moves and player usernames
  const gamesWithDetails = await Promise.all(
    finishedGames.map(async (g) => {
      const moves = await db().query.movesTable.findMany({
        where: (movesTable, { eq }) => eq(movesTable.gameId, g.id),
        orderBy: (movesTable, { asc }) => [asc(movesTable.moveNumber)],
      });

      const whitePlayer = await db().query.playersTable.findFirst({
        where: (p, { eq }) => eq(p.id, g.whitePlayerId!),
      });
      const blackPlayer = await db().query.playersTable.findFirst({
        where: (p, { eq }) => eq(p.id, g.blackPlayerId!),
      });

      return {
        game: g,
        moves,
        whiteUsername: whitePlayer?.username ?? "Unknown",
        blackUsername: blackPlayer?.username ?? "Unknown",
      };
    }),
  );

  if (gamesWithDetails.length === 0) {
    return <div className="p-4">No finished games found.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Game History</h1>
      <div className="flex flex-col gap-6">
        {gamesWithDetails.map(({ game, moves, whiteUsername, blackUsername }) => (
          <div
            key={game.id}
            className="border rounded-md p-3 bg-card shadow-sm"
            aria-labelledby={`game-${game.id}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <Link
                  href={`/games/${game.id}`}
                  className="font-semibold text-lg hover:underline"
                >
                  {whiteUsername} (White) vs {blackUsername} (Black)
                </Link>
                <div className="text-sm text-muted-foreground">
                  Result: {game.status} • Last move: {game.lastMoveAt ?? "—"}
                </div>
              </div>
              <div className="text-sm">
                {session?.playerId &&
                (session.playerId === game.whitePlayerId ||
                  session.playerId === game.blackPlayerId) ? (
                  <span className="text-accent">Your game</span>
                ) : null}
              </div>
            </div>

            <div className="mt-2">
              <div className="text-sm font-medium mb-1">Moves</div>
              <div className="grid grid-cols-1 gap-1">
                {moves.map((m) => (
                  <div
                    key={m.id}
                    className="text-sm text-slate-700 flex items-center gap-3"
                  >
                    <span className="w-8 text-xs text-muted-foreground">
                      {m.moveNumber}.
                    </span>
                    <span>
                      {m.fromSquare} → {m.toSquare}
                      {m.promotion ? ` =${m.promotion}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}