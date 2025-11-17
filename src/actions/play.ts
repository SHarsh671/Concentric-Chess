"use server";

import { db } from "@/lib/db";
import * as schema from "shared/schema";
import * as t from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { startingTime } from "shared/rules";
import { redirect } from "next/navigation";
import { serialize } from "cookie";

export type GameMode = "online" | "local";

export type PlayState = {
  variant?: schema.GameVariant;
  mode?: GameMode;
  username?: string;
  error?: string;
};

export async function play(_prevState: PlayState | null, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return {
      error: "You must be logged in to play.",
    };
  }
  const variant = formData.get("variant") as schema.GameVariant;
  if (schema.GAME_VARIANTS.findIndex((v) => v.variant === variant) === -1) {
    return {
      error: "Invalid game variant selected.",
    };
  }
  const mode = formData.get("mode") as GameMode;
  if (mode !== "online" && mode !== "local") {
    return {
      variant,
      error: "Invalid game mode selected.",
    };
  }
  switch (mode) {
    case "online":
      const username = formData.get("username") as string | null;
      if (username) {
        const player = await db()
          .select()
          .from(schema.playersTable)
          .where(t.eq(schema.playersTable.username, username))
          .limit(1)
          .then((rows) => rows[0]);
        if (!player) {
          return {
            variant,
            mode,
            error: `"${username}" not found.`,
          };
        }
        // check if a game already exists between these two players
        const existingGame = await db()
          .select()
          .from(schema.gamesTable)
          .where(
            t.and(
              t.or(
                t.and(
                  t.eq(schema.gamesTable.whitePlayerId, session.playerId),
                  t.eq(schema.gamesTable.blackPlayerId, player.id),
                ),
                t.and(
                  t.eq(schema.gamesTable.whitePlayerId, player.id),
                  t.eq(schema.gamesTable.blackPlayerId, session.playerId),
                ),
              ),
              t.eq(schema.gamesTable.status, "ongoing"),
              t.isNull(schema.gamesTable.deletedAt),
            ),
          )
          .limit(1)
          .then((rows) => rows[0]);
        if (existingGame) {
          return {
            variant,
            mode,
            username,
            error:
              "A game already exists between you and the selected opponent.",
          };
        }
        // otherwise, create a new game
        const gameId = crypto.randomUUID();
        const whitePlayerId =
          Math.random() < 0.5 ? session.playerId : player.id;
        const blackPlayerId =
          whitePlayerId === session.playerId ? player.id : session.playerId;
        const whiteAccepted = whitePlayerId === session.playerId ? 1 : 0;
        const blackAccepted = blackPlayerId === session.playerId ? 1 : 0;
        await db()
          .insert(schema.gamesTable)
          .values({
            id: gameId,
            variant,
            whitePlayerId,
            blackPlayerId,
            whiteAccepted,
            blackAccepted,
            whiteDisconnectedAt: null,
            blackDisconnectedAt: null,
            whiteDrawOffer: 0,
            blackDrawOffer: 0,
            status: "ongoing",
            nextMove: 0,
            // this will be set to the current timestamp with the game starts
            lastMoveAt: null,
            whiteTimeLeft: startingTime(variant),
            blackTimeLeft: startingTime(variant),
            whiteRatingBefore: null,
            whiteRatingChange: null,
            blackRatingBefore: null,
            blackRatingChange: null,
            createdAt: new Date().toISOString(),
            deletedAt: null,
          });
        redirect(`/games/${gameId}`);
      } else {
        // check if already in queue
        const existingGame = await db()
          .select()
          .from(schema.gamesTable)
          .where(
            t.and(
              t.or(
                t.and(
                  t.eq(schema.gamesTable.whitePlayerId, session.playerId),
                  t.isNull(schema.gamesTable.blackPlayerId),
                ),
                t.and(
                  t.isNull(schema.gamesTable.whitePlayerId),
                  t.eq(schema.gamesTable.blackPlayerId, session.playerId),
                ),
              ),
              t.eq(schema.gamesTable.status, "ongoing"),
              t.isNull(schema.gamesTable.deletedAt),
            ),
          )
          .limit(1)
          .then((rows) => rows[0]);
        if (existingGame) {
          await db()
            .update(schema.gamesTable)
            .set({ status: "aborted", deletedAt: new Date().toISOString() })
            .where(t.eq(schema.gamesTable.id, existingGame.id));
        }
        // next, check for an existing waiting player
        while (true) {
          const waitingGame = await db()
            .select()
            .from(schema.gamesTable)
            .where(
              t.and(
                t.or(
                  t.and(
                    t.isNull(schema.gamesTable.whitePlayerId),
                    t.eq(schema.gamesTable.variant, variant),
                  ),
                  t.and(
                    t.isNull(schema.gamesTable.blackPlayerId),
                    t.eq(schema.gamesTable.variant, variant),
                  ),
                ),
                t.eq(schema.gamesTable.status, "ongoing"),
                t.isNull(schema.gamesTable.deletedAt),
              ),
            )
            .limit(1)
            .then((rows) => rows[0]);
          if (!waitingGame) {
            break;
          }
          // attempt to claim the game
          const res = await fetch(
            process.env.NODE_ENV === "development"
              ? `http://localhost:8787/do/games/${waitingGame.id}/accept`
              : `https://your-production-domain.com/do/games/${waitingGame.id}/accept`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Cookie: serialize("session_token", session.token),
              },
              body: JSON.stringify({ sessionToken: session.token }),
            },
          );
          if (res.ok) {
            redirect(`/games/${waitingGame.id}`);
          } else if (res.status === 409) {
            // someone else claimed it first
            continue;
          } else if (res.status === 500) {
            // try again
            continue;
          } else {
            // otherwise, we didn't encounter an error, but also didn't claim the game
            // so we just break out and create a new one
            break;
          }
        }
        // otherwise, create a new game
        const gameId = crypto.randomUUID();
        const whitePlayerId = Math.random() < 0.5 ? session.playerId : null;
        const blackPlayerId =
          whitePlayerId === session.playerId ? null : session.playerId;
        const whiteAccepted = whitePlayerId === session.playerId ? 1 : 0;
        const blackAccepted = blackPlayerId === session.playerId ? 1 : 0;
        await db()
          .insert(schema.gamesTable)
          .values({
            id: gameId,
            variant,
            whitePlayerId,
            blackPlayerId,
            whiteAccepted,
            blackAccepted,
            whiteDisconnectedAt: null,
            blackDisconnectedAt: null,
            whiteDrawOffer: 0,
            blackDrawOffer: 0,
            status: "ongoing",
            nextMove: 0,
            // this will be set to the current timestamp with the game starts
            lastMoveAt: null,
            whiteTimeLeft: startingTime(variant),
            blackTimeLeft: startingTime(variant),
            whiteRatingBefore: null,
            whiteRatingChange: null,
            blackRatingBefore: null,
            blackRatingChange: null,
            createdAt: new Date().toISOString(),
            deletedAt: null,
          });
        redirect(`/games/${gameId}`);
      }
    case "local":
      // check if there's already a local game
      const existingGame = await db()
        .select()
        .from(schema.gamesTable)
        .where(
          t.and(
            t.and(
              t.eq(schema.gamesTable.whitePlayerId, session.playerId),
              t.eq(schema.gamesTable.blackPlayerId, session.playerId),
            ),
            t.eq(schema.gamesTable.status, "ongoing"),
            t.isNull(schema.gamesTable.deletedAt),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]);
      if (existingGame) {
        return {
          variant,
          mode,
          error: "You are already in the matchmaking queue.",
        };
      }
      // otherwise, create a new game
      const gameId = crypto.randomUUID();
      await db()
        .insert(schema.gamesTable)
        .values({
          id: gameId,
          variant,
          whitePlayerId: session.playerId,
          blackPlayerId: session.playerId,
          whiteAccepted: 1,
          blackAccepted: 1,
          whiteDisconnectedAt: null,
          blackDisconnectedAt: null,
          whiteDrawOffer: 0,
          blackDrawOffer: 0,
          status: "ongoing",
          nextMove: 0,
          // this will be set to the current timestamp with the game starts
          lastMoveAt: null,
          whiteTimeLeft: startingTime(variant),
          blackTimeLeft: startingTime(variant),
          whiteRatingBefore: null,
          whiteRatingChange: null,
          blackRatingBefore: null,
          blackRatingChange: null,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        });
      redirect(`/games/${gameId}`);
  }
}
