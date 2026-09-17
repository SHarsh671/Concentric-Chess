import "server-only";
import { db } from "./db";
import * as t from "drizzle-orm";
import { gamesTable, playersTable, type Game } from "shared";

export type PendingInvite = {
  game: Game;
  opponentUsername: string;
  side: "white" | "black";
};

// A "received" invite is a direct-invite game where the current player hasn't
// accepted yet but the opponent already has (see src/actions/play.ts, which
// marks the inviter's side accepted immediately).
export async function getReceivedInvites(
  playerId: string,
): Promise<PendingInvite[]> {
  const games = await db()
    .select()
    .from(gamesTable)
    .where(
      t.and(
        t.eq(gamesTable.status, "ongoing"),
        t.isNull(gamesTable.deletedAt),
        t.isNotNull(gamesTable.whitePlayerId),
        t.isNotNull(gamesTable.blackPlayerId),
        t.or(
          t.and(
            t.eq(gamesTable.whitePlayerId, playerId),
            t.eq(gamesTable.whiteAccepted, 0),
            t.eq(gamesTable.blackAccepted, 1),
          ),
          t.and(
            t.eq(gamesTable.blackPlayerId, playerId),
            t.eq(gamesTable.blackAccepted, 0),
            t.eq(gamesTable.whiteAccepted, 1),
          ),
        ),
      ),
    );
  return await withOpponentUsernames(games, playerId);
}

// A "sent" invite is a direct-invite game where the current player has
// already accepted (they created it) and is waiting on the opponent.
export async function getSentInvites(
  playerId: string,
): Promise<PendingInvite[]> {
  const games = await db()
    .select()
    .from(gamesTable)
    .where(
      t.and(
        t.eq(gamesTable.status, "ongoing"),
        t.isNull(gamesTable.deletedAt),
        t.isNotNull(gamesTable.whitePlayerId),
        t.isNotNull(gamesTable.blackPlayerId),
        t.or(
          t.and(
            t.eq(gamesTable.whitePlayerId, playerId),
            t.eq(gamesTable.whiteAccepted, 1),
            t.eq(gamesTable.blackAccepted, 0),
          ),
          t.and(
            t.eq(gamesTable.blackPlayerId, playerId),
            t.eq(gamesTable.blackAccepted, 1),
            t.eq(gamesTable.whiteAccepted, 0),
          ),
        ),
      ),
    );
  return await withOpponentUsernames(games, playerId);
}

async function withOpponentUsernames(
  games: Game[],
  playerId: string,
): Promise<PendingInvite[]> {
  return await Promise.all(
    games.map(async (game) => {
      const side: "white" | "black" =
        game.whitePlayerId === playerId ? "white" : "black";
      const opponentId =
        side === "white" ? game.blackPlayerId : game.whitePlayerId;
      const opponent = opponentId
        ? await db().query.playersTable.findFirst({
            where: t.eq(playersTable.id, opponentId),
          })
        : undefined;
      return {
        game,
        opponentUsername: opponent?.username ?? "Unknown",
        side,
      };
    }),
  );
}
