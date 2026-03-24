import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

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
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white border-4 border-black p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">GAME HISTORY</h1>
            <p className="text-gray-600">No finished games found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="bg-white border-4 border-black p-6">
            <h1 className="text-4xl font-bold text-black uppercase">
              Game History
            </h1>
            <p className="text-gray-600 mt-2">
              {gamesWithDetails.length} finished game
              {gamesWithDetails.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {gamesWithDetails.map(
            ({ game, moves, whiteUsername, blackUsername }) => (
              <div
                key={game.id}
                className="bg-white border-4 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/games/${game.id}`}
                        className="text-2xl font-bold hover:underline"
                      >
                        {whiteUsername} vs {blackUsername}
                      </Link>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-medium">
                          Result:{" "}
                          <span className="text-black font-bold uppercase">
                            {game.status}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{moves.length} moves</span>
                        {game.lastMoveAt && (
                          <>
                            <span>•</span>
                            <span>
                              {new Date(game.lastMoveAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                      {session?.playerId &&
                        (session.playerId === game.whitePlayerId ||
                          session.playerId === game.blackPlayerId) && (
                          <div className="mt-2">
                            <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase border-2 border-black">
                              Your game
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        asChild
                        className="bg-black text-white hover:bg-gray-800 border-2 border-black font-bold"
                      >
                        <Link href={`/replay/${game.id}`}>
                          <Play className="mr-2 h-4 w-4" />
                          WATCH REPLAY
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Move preview - show first few moves */}
                  <div className="mt-4 border-t-2 border-gray-200 pt-4">
                    <div className="text-sm font-bold mb-2 uppercase text-gray-600">
                      Move Preview
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {moves.slice(0, 8).map((m) => (
                        <div
                          key={m.id}
                          className="text-sm bg-gray-50 border-2 border-gray-300 p-2"
                        >
                          <span className="font-bold text-xs text-gray-500">
                            {m.moveNumber}.
                          </span>{" "}
                          {m.fromSquare} → {m.toSquare}
                          {m.promotion ? ` =${m.promotion}` : ""}
                        </div>
                      ))}
                      {moves.length > 8 && (
                        <div className="text-sm bg-gray-50 border-2 border-gray-300 p-2 flex items-center justify-center text-gray-500 font-bold">
                          +{moves.length - 8} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
